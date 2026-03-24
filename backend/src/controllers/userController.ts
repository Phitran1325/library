import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { validateProfileUpdateFields } from '../middleware/validation';

interface AuthRequest extends Request {
  user?: any;
}

// GET /users/readers/count - Public reader count
export const getPublicReaderCount = async (_req: Request, res: Response) => {
  try {
    const totalReaders = await User.countDocuments({ role: 'Reader' });

    res.status(200).json({
      success: true,
      data: { totalReaders }
    });
  } catch (error) {
    console.error('Error getting reader count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, phoneNumber, address } = req.body;

    const validation = validateProfileUpdateFields(fullName, phoneNumber, address);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const user = await User.findById(req.user.userId);

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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { avatarUrl } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      message: 'Avatar updated successfully',
      avatarUrl: user.avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, role, status, search, sort = 'createdAt', order = 'desc' } = req.query;
    const skip = ((Number(page) - 1) * Number(limit));

    let query: any = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    sortObj[String(sort)] = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-passwordHash -verificationToken -resetPasswordToken')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Librarian', 'Reader'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended', 'Banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};