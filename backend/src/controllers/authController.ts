import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import BlacklistedToken from '../models/BlacklistedToken';
import User from '../models/User';
import { validateEmail, validatePassword, validateFullName, validateOTP } from '../utils/validators';
import { sendVerificationOTP, sendPasswordResetOTP } from '../services/emailService';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        [key: string]: any;
      };
    }
  }
}

// Initialize Google OAuth2 client
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      console.log('Missing fields:', { fullName, email, password, confirmPassword });
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateFullName(fullName)) {
      return res.status(400).json({ message: 'Full name must be 3-30 characters (letters and spaces only)' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists with email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists and has a Google ID but no password, they're a Google-only user
      if (existingUser.googleId && !existingUser.passwordHash) {
        return res.status(400).json({ message: 'This email is already registered with Google. Please use Google login.' });
      }
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
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
    await sendVerificationOTP(email, otpCode);

    res.status(201).json({ 
      message: 'User registered successfully. Please verify your email.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    if (!validateOTP(otpCode)) {
      return res.status(400).json({ message: 'OTP must be 6 digits' });
    }

    const user = await User.findOne({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

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

    // Check isActive
    if (!user.isActive) {
     return res.status(403).json({ message: 'Account is not active' });
}

    // Check if user is a Google user (no password hash)
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Please use Google login for this account' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    // Ensure types match jwt.sign overloads: use string secret and stringifiable payload
  const payload = { userId: (user._id as any).toString(), role: user.role, email: user.email };
  const secret = (process.env.JWT_SECRET as jwt.Secret) || '';
  // Cast sign options to satisfy TypeScript overloads
  const token = jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRY || '24h' } as unknown as jwt.SignOptions);

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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Temporary mock Google login for testing
export const mockGoogleLogin = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.body;

    // Mock verification - in real scenario, this would be verified with Google
    if (tokenId !== 'mock-google-token') {
      return res.status(401).json({ message: 'Invalid mock token' });
    }

    // Mock Google user data
    const mockGoogleData = {
      googleId: 'mock-google-id-123',
      email: 'mockuser@example.com',
      name: 'Mock Google User',
      picture: 'https://example.com/mock-avatar.jpg'
    };

    const { googleId, email, name, picture } = mockGoogleData;

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with Google ID, update last login
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Check if user exists with email
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (name) user.fullName = name;
        if (picture) user.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Create new user
        const newUser = new User({
          email: email.toLowerCase(),
          username: email.split('@')[0],
          // Password hash is omitted for Google users (will be undefined)
          fullName: name || email.split('@')[0],
          avatar: picture || '',
          googleId,
          status: 'Active', // Google users are automatically active
        });

        await newUser.save();
        user = newUser;
      }
    }

    // Generate JWT for our system
    const jwtPayload = { userId: (user._id as any).toString(), role: user.role, email: user.email };
    const secret = (process.env.JWT_SECRET as jwt.Secret) || '';
    const token = jwt.sign(jwtPayload, secret, { expiresIn: process.env.JWT_EXPIRY || '24h' } as unknown as jwt.SignOptions);

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
  } catch (error) {
    console.error('Mock Google login error:', error);
    res.status(500).json({ message: 'Server error during mock Google authentication' });
  }
};

// Updated Google login function with proper error handling
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.trim() === '') {
      console.error('Google login attempted without GOOGLE_CLIENT_ID configured on the server');
      return res.status(500).json({ message: 'Google login is not configured on the server' });
    }

    // Verify Google token
    let ticket;
    try {
      ticket = await oauth2Client.verifyIdToken({
        idToken: tokenId,
        audience: googleClientId,
      });
    } catch (verificationError) {
      console.error('Google token verification error:', verificationError);
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    if (payload.aud !== googleClientId) {
      console.error('Google token audience mismatch. Expected:', googleClientId, 'Received:', payload.aud);
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with Google ID, update last login
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Check if user exists with email
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (name) user.fullName = name;
        if (picture) user.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        // Create new user
        const newUser = new User({
          email: email.toLowerCase(),
          username: email.split('@')[0],
          // Password hash is omitted for Google users (will be undefined)
          fullName: name || email.split('@')[0],
          avatar: picture || '',
          googleId,
          status: 'Active', // Google users are automatically active
        });

        await newUser.save();
        user = newUser;
      }
    }

    // Generate JWT for our system
    const jwtPayload = { userId: (user._id as any).toString(), role: user.role, email: user.email };
    const secret = (process.env.JWT_SECRET as jwt.Secret) || '';
    const token = jwt.sign(jwtPayload, secret, { expiresIn: process.env.JWT_EXPIRY || '24h' } as unknown as jwt.SignOptions);

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
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({ message: 'If email exists, OTP has been sent' });
    }

    // Check if user is a Google-only user
    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({ message: 'Google accounts cannot reset passwords. Please use Google login.' });
    }

    // Generate OTP for password reset
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otpCode;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP
    await sendPasswordResetOTP(email, otpCode);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otpCode, newPassword, confirmPassword } = req.body;

    if (!email || !otpCode || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be 8+ characters with uppercase, lowercase, and number' 
      });
    }

    const otpValue = otpCode.toString();
    const user = await User.findOne({
      email: email.toLowerCase(),
      otpCode: otpValue,
      otpExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ 
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
    await sendVerificationOTP(email, otpCode);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a Google-only user
    if (user.googleId && !user.passwordHash) {
      return res.status(400).json({ message: 'Google accounts cannot change passwords.' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be 8+ characters with uppercase, lowercase, and number' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify to ensure token is valid and to read exp
    const decoded = jwt.verify(token, (process.env.JWT_SECRET as jwt.Secret) || '') as jwt.JwtPayload;
    const expSeconds = decoded?.exp;

    // If token has an exp, use it; otherwise fall back to 24h from now
    const expiresAt = expSeconds ? new Date(expSeconds * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in denylist with TTL via expiresAt
    await BlacklistedToken.updateOne(
      { token },
      { $set: { token, expiresAt } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};