import { Request, Response } from "express";
import { Coin, ICoin } from "../models/coin";

//https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_change=true

import schedule from "node-schedule";
import { Price } from "../models/price";
import { redis } from "..";

const fetchPrices = async (coinIds: string[]) => {
  try {
    const responses = await Promise.all(
      coinIds.map((id) =>
        fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
        ).then((res) => res.json())
      )
    );
    return responses;
  } catch (error: any) {
    console.error("Error fetching prices:", error.message);
    throw new Error("Failed to fetch coin prices");
  }
};

export const getCoinPrice = async () => {
  try {
    const coins = await Coin.find({
      uniqueName: { $in: ["bitcoin", "ethereum", "matic-network"] },
    });

    if (coins.length !== 3) {
      throw new Error("One or more coin IDs not found");
    }

    const coinIds = coins.map((coin) => coin.uniqueName);
    const response = await fetchPrices(coinIds);
    console.log("Coin IDs:", coinIds);
    console.log("Fetched Prices Response:", response);

    const priceData = coins
      .map((coin, index) => {
        const uniqueName = coin.uniqueName; // For clarity
        const coinData = response[index][uniqueName];
        if (!coinData) {
          console.error(`Missing data for coin: ${uniqueName}`);
          return null;
        }

        return {
          coinId: coin._id,
          price: coinData.usd,
          marketCap: coinData.usd_market_cap,
          change24hr: coinData.usd_24h_change,
          date: new Date(),
        };
      })
      .filter(Boolean);
    console.log(priceData);

    await Price.insertMany(priceData);
  } catch (error: any) {
    console.error("Error in getCoinPrice:", error.message);
  }
};

// Schedule the job to run every 2 hours
schedule.scheduleJob("0 */2 * * *", async () => {
  console.log("Running getCoinPrice job at:", new Date().toISOString());
  await getCoinPrice();
});

export const createCoin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uniqueName, name, symbol }: ICoin = req.body;
    if (!name || !symbol || !uniqueName) {
      res.status(400).send("Name and symbol are required");
      return;
    }
    const coinExists = await Coin.findOne({
      $or: [{ name }, { symbol }, { uniqueName }],
    });
    if (coinExists) {
      res.status(400).send("Coin already exists");
      return;
    }
    const coin = new Coin({ uniqueName, name, symbol });

    await coin.save();

    res.status(201).json({
      success: true,
      message: "Coin created successfully",
      coin: {
        uniqueName, // this represents id
        name,
        symbol,
      },
    });
    return;
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const coin = req.query.coin?.toString();
    if (!coin) {
      res.status(400).send("Coin ID is required");
      return;
    }

    const redisKey = `coin:${coin}:stats`;
    const cachedStats = await redis.get(redisKey);
    if (cachedStats) {
      res.status(200).json({ success: true, data: cachedStats });
      return;
    }

    const coinDB = await Coin.findOne({ uniqueName: coin });
    if (!coinDB) {
      res.status(404).json({ success: false, message: "Coin not found" });
      return;
    }
    const stats = await Price.find({ coinId: coinDB?._id });

    stats.sort((a, b) => b.date.getTime() - a.date.getTime());

    const latestPrice = stats[0].price;

    await redis.set(redisKey, latestPrice);
    await redis.expire(redisKey, 2 * 60 * 60);

    res.status(200).json({
      success: true,
      data: latestPrice,
    });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

export const getDeviation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { coin } = req.query;
    if (!coin) {
      res.status(400).json({ success: false, message: "Coin is required" });
      return;
    }

    const redisKey = `coin:${coin}:deviation`;
    const cachedDeviation = await redis.get(redisKey);
    if (cachedDeviation) {
      res
        .status(200)
        .json({ success: true, deviation: parseFloat(cachedDeviation) });
      return;
    }

    const coinDoc = await Coin.findOne({ uniqueName: coin });
    if (!coinDoc) {
      res.status(404).json({ success: false, message: "Coin not found" });
      return;
    }

    const stats = await Price.find({ coinId: coinDoc._id })
      .sort({ date: -1 })
      .limit(100);

    if (stats.length === 0) {
      res.status(404).json({ success: false, message: "No price data found" });
      return;
    }

    const prices = stats.map((stat) => stat.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      prices.length;
    const deviation = Math.sqrt(variance);

    await redis.set(redisKey, deviation.toFixed(2));
    await redis.expire(redisKey, 2 * 60 * 60);
    res
      .status(200)
      .json({ success: true, deviation: parseFloat(deviation.toFixed(2)) });
  } catch (error: any) {
    console.error("Error in getDeviation:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
