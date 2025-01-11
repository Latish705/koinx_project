import { Request, Response } from "express";
import { Coin, ICoin } from "../models/coin";

//https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_change=true

import schedule from "node-schedule";
import { Price } from "../models/price";

const fetchPrice = async (
  bitcoinId: string,
  ethereumId: string,
  maticId: string
) => {
  const bitcoinData = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${bitcoinId}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
  ).then((res) => res.json());

  const ethereumData = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ethereumId}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
  ).then((res) => res.json());

  const maticData = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${maticId}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`
  ).then((res) => res.json());

  return [bitcoinData, ethereumData, maticData];
};

export const getCoinPrice = async () => {
  try {
    const bitcoinId = await Coin.findOne({ uniqueName: "bitcoin" });
    const ethereumId = await Coin.findOne({ uniqueName: "ethereum" });
    const maticId = await Coin.findOne({ uniqueName: "matic-network" });

    if (!bitcoinId || !ethereumId || !maticId) {
      throw new Error("One or more coin IDs not found");
    }

    const response = await fetchPrice(
      bitcoinId.uniqueName,
      ethereumId.uniqueName,
      maticId.uniqueName
    );

    console.log("Fetched data:", response);

    await Price.insertMany([
      {
        coinId: bitcoinId._id,
        price: response[0].bitcoin.usd,
        date: new Date(),
      },
      {
        coinId: ethereumId._id,
        price: response[1].ethereum.usd,
        date: new Date(),
      },
      {
        coinId: maticId._id,
        price: response[2]["matic-network"].usd,
        date: new Date(),
      },
    ]);
  } catch (error: any) {
    console.log("Error fetching coin prices:", error.message);
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
    const coinId = req.params.coinId;

    const stats = await Price.find({ coinId });
    stats.sort((a, b) => b.date.getTime() - a.date.getTime());
    // need the latest fetched price
    const latestPrice = stats[0].price;

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
    const coinId = req.query.coin as string; // Assuming `coin` is passed as a query parameter
    if (!coinId) {
      res.status(400).send("Coin ID is required");
    }

    // Fetch the last 100 records sorted by date in descending order
    const stats = await Price.find({ coinId }).sort({ date: -1 }).limit(100);

    if (stats.length === 0) {
      res.status(404).send("No price data found for the given coin");
    }

    // Extract prices from the stats
    const prices = stats.map((stat) => stat.price);

    // Calculate the mean (average)
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate the variance
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      prices.length;

    // Calculate the standard deviation
    const deviation = Math.sqrt(variance);

    res.status(200).json({
      deviation: parseFloat(deviation.toFixed(2)), // Limit to 2 decimal places
    });
  } catch (error: any) {
    console.error("Error in getDeviation:", error.message);
    res.status(500).send("Server Error");
  }
};
