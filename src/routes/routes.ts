import { Router } from "express";
import {
  createCoin,
  getCoinPrice,
  getDeviation,
  getStats,
} from "../controller/coin.controller";

const appRouter = Router();

appRouter.get("/getcoin", getCoinPrice);

appRouter.post("/create", createCoin);

appRouter.get("/stats", getStats);

appRouter.get("/deviation", getDeviation);

export default appRouter;
