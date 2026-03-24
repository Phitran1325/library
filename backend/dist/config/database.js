"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load biến môi trường từ .env
// Tránh log lộ MONGO_URI
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('❌ MONGO_URI is not defined in .env file');
        }
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected successfully`);
        console.log(`📦 Database name: ${conn.connection.name}`);
        console.log(`🌐 Host: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('🚨 MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map