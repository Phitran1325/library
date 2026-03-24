"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminUser = seedAdminUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
async function seedAdminUser() {
    try {
        const existingAdmin = await User_1.default.findOne({ email: 'admin@library.local', role: 'Admin' });
        if (existingAdmin) {
            return; // Admin already exists
        }
        const hashedPassword = await bcryptjs_1.default.hash('Admin@123456', 10);
        const adminUser = new User_1.default({
            email: 'admin@library.local',
            username: 'admin',
            passwordHash: hashedPassword,
            fullName: 'Library Administrator',
            role: 'Admin',
            status: 'Active',
            isActive: true,
            canBorrow: true,
            walletBalance: 0,
            totalSpent: 0,
        });
        await adminUser.save();
        console.log('✅ Seeded admin user: admin@library.local / Admin@123456');
    }
    catch (err) {
        console.error('🚨 Failed to seed admin user:', err);
    }
}
//# sourceMappingURL=seedAdminUser.js.map