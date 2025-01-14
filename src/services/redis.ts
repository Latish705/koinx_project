import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();
const connectRedis = async () => {
  try {
    const redis = new Redis({
      url: process.env.REDIS_URI,
      token: process.env.REDIS_TOKEN,
    });
    console.log("Redis connected");
    return redis;
  } catch (error: any) {
    console.log(error.message);
    process.exit(1);
  }
};

export default connectRedis;
