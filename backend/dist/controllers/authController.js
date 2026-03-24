"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.resendOTP = exports.resetPassword = exports.forgotPassword = exports.login = exports.verifyEmail = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BlacklistedToken_1 = __importDefault(require("../models/BlacklistedToken"));
const User_1 = __importDefault(require("../models/User"));
const validators_1 = require("../utils/validators");
const emailService_1 = require("../services/emailService");
const register = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        const { fullName, email, password, confirmPassword } = req.body;
        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            console.log('Missing fields:', { fullName, email, password, confirmPassword });
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!(0, validators_1.validateFullName)(fullName)) {
            return res.status(400).json({ message: 'Full name must be 3-30 characters (letters and spaces only)' });
        }
        if (!(0, validators_1.validateEmail)(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!(0, validators_1.validatePassword)(password)) {
            return res.status(400).json({
                message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        // Check if user exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Generate OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // Create user
        const user = new User_1.default({
            email: email.toLowerCase(),
            username: email.split('@')[0], // Generate username from email
            passwordHash: hashedPassword,
            fullName,
            otpCode,
            otpExpiry,
            status: 'Suspended', // Needs email verification (using Suspended as pre-activation state)
        });
        await user.save();
        // Send verification OTP
        await (0, emailService_1.sendVerificationOTP)(email, otpCode);
        res.status(201).json({
            message: 'User registered successfully. Please verify your email.'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const verifyEmail = async (req, res) => {
    try {
        const { email, otpCode } = req.body;
        if (!email || !otpCode) {
            return res.status(400).json({ message: 'Email and OTP code are required' });
        }
        if (!(0, validators_1.validateOTP)(otpCode)) {
            return res.status(400).json({ message: 'OTP must be 6 digits' });
        }
        const user = await User_1.default.findOne({
            email: email.toLowerCase(),
            otpCode,
            otpExpiry: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP code' });
        }
        // Clear OTP and activate user
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        user.status = 'Active';
        await user.save();
        res.status(200).json({ message: 'Email verified successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check if email is verified
        if (user.status === 'Suspended') {
            return res.status(401).json({ message: 'Please verify your email first' });
        }
        // Check status
        if (user.status !== 'Active') {
            return res.status(403).json({ message: 'Account is not active' });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT
        // Ensure types match jwt.sign overloads: use string secret and stringifiable payload
        const payload = { userId: user._id.toString(), role: user.role, email: user.email };
        const secret = process.env.JWT_SECRET || '';
        // Cast sign options to satisfy TypeScript overloads
        const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRY || '24h' });
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if email exists
            return res.status(200).json({ message: 'If email exists, OTP has been sent' });
        }
        // Generate OTP for password reset
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpCode = otpCode;
        user.otpExpiry = otpExpiry;
        await user.save();
        // Send OTP email
        await (0, emailService_1.sendPasswordResetOTP)(email, otpCode);
        res.status(200).json({ message: 'Password reset OTP sent to email' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, otpCode, otp, newPassword, confirmPassword } = req.body;
        const otpValue = otpCode || otp;
        if (!email || !otpValue || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!(0, validators_1.validateOTP)(otpValue)) {
            return res.status(400).json({ message: 'OTP must be 6 digits' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        if (!(0, validators_1.validatePassword)(newPassword)) {
            return res.status(400).json({
                message: 'Password must be 8+ characters with uppercase, lowercase, and number'
            });
        }
        const user = await User_1.default.findOne({
            email: email.toLowerCase(),
            otpCode: otpValue,
            otpExpiry: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP code' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.resetPassword = resetPassword;
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const user = await User_1.default.findOne({
            email: email.toLowerCase(),
            status: 'Suspended'
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or already verified' });
        }
        // Generate new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpCode = otpCode;
        user.otpExpiry = otpExpiry;
        await user.save();
        // Send new OTP
        await (0, emailService_1.sendVerificationOTP)(email, otpCode);
        res.status(200).json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.resendOTP = resendOTP;
const changePassword = async (req, res) => {
    try {
        // req.user may be undefined; guard and access userId safely
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Verify old password
        const isOldPasswordValid = await bcryptjs_1.default.compare(oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        if (!(0, validators_1.validatePassword)(newPassword)) {
            return res.status(400).json({
                message: 'Password must be 8+ characters with uppercase, lowercase, and number'
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.changePassword = changePassword;
const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Verify to ensure token is valid and to read exp
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        const expSeconds = decoded?.exp;
        // If token has an exp, use it; otherwise fall back to 24h from now
        const expiresAt = expSeconds ? new Date(expSeconds * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        // Store token in denylist with TTL via expiresAt
        await BlacklistedToken_1.default.updateOne({ token }, { $set: { token, expiresAt } }, { upsert: true });
        return res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map