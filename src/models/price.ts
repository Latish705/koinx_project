import mongoose, { Schema, model } from "mongoose";

export interface IPrice {
  coinId: mongoose.Types.ObjectId; // Links to the Coin model
  price: number;
  marketCap: number;
  change24hr: number;
  date: Date;
}

const PriceSchema = new Schema<IPrice>({
  coinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coin", // Reference to Coin model
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  marketCap: {
    type: Number,
    required: true,
  },
  change24hr: {
    type: Number,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },
});

export const Price = model<IPrice>("Price", PriceSchema);
