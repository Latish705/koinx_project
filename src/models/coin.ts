import mongoose, { Schema, model } from "mongoose";

export interface ICoin {
  name: string;
  symbol: string; // e.g., BTC, ETH
}

const CoinSchema = new Schema<ICoin>(
  {
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Coin = model<ICoin>("Coin", CoinSchema);
