import app from "./app";
import connectDB from "./services/db";
import dotenv from "dotenv";
import connectRedis from "./services/redis";
dotenv.config();

const PORT = process.env.PORT || 8000;

export let redis: any;

const startServer = async () => {
  try {
    redis = await connectRedis();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error("Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();
