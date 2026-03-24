"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserStatus = exports.updateUserRole = exports.getAllUsers = exports.uploadAvatar = exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const validation_1 = require("../middleware/validation");
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, address } = req.body;
        const validation = (0, validation_1.validateProfileUpdateFields)(fullName, phoneNumber, address);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.message });
        }
        const user = await User_1.default.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.fullName = fullName || user.fullName;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.address = address || user.address;
        await user.save();
        res.status(200).json({
            message: 'Profile updated successfully',
            user: user.toObject()
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProfile = updateProfile;
const uploadAvatar = async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        const user = await User_1.default.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.avatar = avatarUrl;
        await user.save();
        res.status(200).json({
            message: 'Avatar updated successfully',
            avatarUrl: user.avatar
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadAvatar = uploadAvatar;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search, sort = 'createdAt', order = 'desc' } = req.query;
        const skip = ((Number(page) - 1) * Number(limit));
        let query = {};
        if (role)
            query.role = role;
        if (status)
            query.status = status;
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
            ];
        }
        const sortObj = {};
        sortObj[String(sort)] = order === 'desc' ? -1 : 1;
        const users = await User_1.default.find(query)
            .select('-passwordHash -verificationToken -resetPasswordToken')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit));
        const total = await User_1.default.countDocuments(query);
        res.status(200).json({
            users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!['Admin', 'Librarian', 'Reader'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await User_1.default.findByIdAndUpdate(userId, { role }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User role updated', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserRole = updateUserRole;
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!['Active', 'Suspended', 'Banned'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const user = await User_1.default.findByIdAndUpdate(userId, { status }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User status updated', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserStatus = updateUserStatus;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=userController.js.map