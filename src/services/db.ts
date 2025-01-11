import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    // @ts-ignore
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return;
  } catch (error: any) {
    console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;
