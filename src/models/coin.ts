import mongoose, { Schema, model } from "mongoose";

export interface ICoin {
  uniqueName: string; // bitcoin
  name: string; // Bitcoin
  symbol: string; // e.g., BTC, ETH
}

const CoinSchema = new Schema<ICoin>(
  {
    uniqueName: {
      type: String,
      required: true,
      unique: true,
    },
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
