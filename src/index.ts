import app from "./app";
import connectDB from "./services/db";
import dotenv from "dotenv";
import connectRedis from "./services/redis";
dotenv.config();

const PORT = process.env.PORT || 8000;

export let redis: any;

connectDB()
  .then(() => {
    redis = connectRedis();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
