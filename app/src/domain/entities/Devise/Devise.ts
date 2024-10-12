import mongoose from "mongoose";

export const convertUnits = new mongoose.Schema({
  value: { type: Int16Array },
  fromUnit: { type: String },
  toUnit: { type: String },
});
