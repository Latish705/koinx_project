import { Router } from "express";
import { getStats } from "../controller/coin.controller";

const router = Router();

router.get("/stats", getStats);

router.get("/deviatioin");
