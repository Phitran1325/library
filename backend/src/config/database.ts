import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load biến môi trường từ .env

// Tránh log lộ MONGO_URI

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI is not defined in .env file');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected successfully`);
    console.log(`📦 Database name: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);

  } catch (error) {
    console.error('🚨 MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
