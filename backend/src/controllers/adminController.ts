import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Book from '../models/Book';
import Borrow from '../models/Borrow';
import BookCopy from '../models/BookCopy';
import Reservation from '../models/Reservation';
import MembershipSubscription from '../models/MembershipSubscription';
import { 
  autoLockBorrowingPermissionForOverdue,
  autoLockBorrowingPermissionForPenaltyDebt 
} from '../services/violationService';

interface AuthRequest extends Request {
  user?: any;
}

// GET /admin/users - Lấy danh sách tất cả users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      isActive,
      search, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = ((Number(page) - 1) * Number(limit));
    
    let query: any = {};

    // Filter by role
    if (role) query.role = role;
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by isActive
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by email, username, or fullName
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
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
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/update-role/:id - Thay đổi role của user
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['Admin', 'Librarian', 'Reader'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role. Must be Admin, Librarian, or Reader' 
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Prevent admin from changing their own role
    if (req.user?.userId === id && role !== 'Admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot change your own role' 
      });
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-passwordHash -verificationToken -resetPasswordToken');

    res.status(200).json({ 
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// PUT /admin/toggle-status/:id - Bật/tắt tài khoản user
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Prevent admin from blocking themselves
    if (req.user?.userId === id) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot block your own account' 
      });
    }

    // Toggle isActive status
    const newStatus = !user.isActive;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true }
    ).select('-passwordHash -verificationToken -resetPasswordToken');

    res.status(200).json({ 
      success: true,
      message: `User account ${newStatus ? 'activated' : 'blocked'} successfully`,
      data: { 
        user: updatedUser,
        isActive: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/users/:id - Lấy thông tin chi tiết user
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-passwordHash -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// DELETE /admin/users/:id - Xóa user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (req.user?.userId === id) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    // Prevent deleting other admin accounts
    if (user.role === 'Admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete admin accounts' 
      });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// GET /admin/books/statistics - Thống kê sách và hoạt động mượn
export const getBookAndBorrowStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'all' } = req.query; // all, today, week, month, year

    const now = new Date();
    let startDate: Date | null = null;

    // Tính ngày bắt đầu dựa trên period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    // ========== THỐNG KÊ SÁCH ==========
    
    // Tổng số sách
    const totalBooks = await Book.countDocuments();
    const activeBooks = await Book.countDocuments({ isActive: true });
    const inactiveBooks = await Book.countDocuments({ isActive: false });

    // Thống kê theo status
    const booksByStatus = await Book.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê theo category
    const booksByCategory = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalAvailable: { $sum: '$available' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Thống kê theo isPremium và isNewRelease
    const premiumBooks = await Book.countDocuments({ isPremium: true, isActive: true });
    const newReleaseBooks = await Book.countDocuments({ isNewRelease: true, isActive: true });

    // Thống kê tổng stock và available
    const stockStats = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          totalAvailable: { $sum: '$available' },
          totalBorrowed: { $sum: { $subtract: ['$stock', '$available'] } },
          averageStock: { $avg: '$stock' },
          averageAvailable: { $avg: '$available' }
        }
      }
    ]);

    // Sách mới thêm theo thời gian
    const newBooksQuery: any = {};
    if (startDate) {
      newBooksQuery.createdAt = { $gte: startDate };
    }
    const newBooks = await Book.countDocuments(newBooksQuery);

    // Top 10 sách được mượn nhiều nhất
    const topBorrowedBooks = await Borrow.aggregate([
      {
        $group: {
          _id: '$book',
          borrowCount: { $sum: 1 },
          activeBorrows: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Borrowed', 'Overdue']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { borrowCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo'
        }
      },
      {
        $unwind: '$bookInfo'
      },
      {
        $project: {
          bookId: '$_id',
          title: '$bookInfo.title',
          category: '$bookInfo.category',
          isPremium: '$bookInfo.isPremium',
          stock: '$bookInfo.stock',
          available: '$bookInfo.available',
          borrowCount: 1,
          activeBorrows: 1
        }
      }
    ]);

    // Top 10 sách có rating cao nhất
    const topRatedBooks = await Book.find({ isActive: true, reviewCount: { $gt: 0 } })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(10)
      .select('title category rating reviewCount stock available isPremium');

    // Sách sắp hết (available < 10% stock)
    const lowStockBooks = await Book.aggregate([
      {
        $match: {
          isActive: true,
          stock: { $gt: 0 }
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          stock: 1,
          available: 1,
          availabilityRate: {
            $cond: [
              { $eq: ['$stock', 0] },
              0,
              { $divide: ['$available', '$stock'] }
            ]
          }
        }
      },
      {
        $match: {
          availabilityRate: { $lt: 0.1 }
        }
      },
      {
        $sort: { availabilityRate: 1 }
      },
      {
        $limit: 10
      }
    ]);

    // Thống kê sách theo ngày thêm (7 ngày gần nhất)
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);
    const booksByDay = await Book.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Thống kê sách theo tháng (12 tháng gần nhất)
    const last12Months = new Date(now);
    last12Months.setMonth(now.getMonth() - 12);
    const booksByMonth = await Book.aggregate([
      {
        $match: {
          createdAt: { $gte: last12Months }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // ========== THỐNG KÊ HOẠT ĐỘNG MƯỢN ==========

    // Tổng số phiếu mượn
    const totalBorrows = await Borrow.countDocuments();
    
    // Thống kê theo status
    const borrowsByStatus = await Borrow.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê theo borrowType
    const borrowsByType = await Borrow.aggregate([
      {
        $group: {
          _id: '$borrowType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Phiếu mượn mới theo thời gian
    const newBorrowsQuery: any = {};
    if (startDate) {
      newBorrowsQuery.borrowDate = { $gte: startDate };
    }
    const newBorrows = await Borrow.countDocuments(newBorrowsQuery);

    // Thống kê mượn theo ngày (7 ngày gần nhất)
    const borrowsByDay = await Borrow.aggregate([
      {
        $match: {
          borrowDate: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$borrowDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Thống kê mượn theo tháng (12 tháng gần nhất)
    const borrowsByMonth = await Borrow.aggregate([
      {
        $match: {
          borrowDate: { $gte: last12Months }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$borrowDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Thống kê phí phạt
    const lateFeeStats = await Borrow.aggregate([
      {
        $group: {
          _id: null,
          totalLateFee: { $sum: '$lateFee' },
          totalDamageFee: { $sum: '$damageFee' },
          totalFees: { $sum: { $add: ['$lateFee', '$damageFee'] } },
          averageLateFee: { $avg: '$lateFee' },
          borrowsWithLateFee: {
            $sum: {
              $cond: [{ $gt: ['$lateFee', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Thống kê gia hạn
    const renewalStats = await Borrow.aggregate([
      {
        $group: {
          _id: null,
          totalRenewals: { $sum: '$renewalCount' },
          averageRenewals: { $avg: '$renewalCount' },
          borrowsWithRenewals: {
            $sum: {
              $cond: [{ $gt: ['$renewalCount', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Sách quá hạn
    const overdueBorrows = await Borrow.countDocuments({
      status: 'Overdue'
    });

    // Thống kê BookCopy
    const totalBookCopies = await BookCopy.countDocuments();
    const bookCopiesByStatus = await BookCopy.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê Reservation
    const totalReservations = await Reservation.countDocuments();
    const reservationsByStatus = await Reservation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format kết quả
    const statusStats: Record<string, number> = {};
    booksByStatus.forEach((item: any) => {
      statusStats[item._id] = item.count;
    });

    const borrowStatusStats: Record<string, number> = {};
    borrowsByStatus.forEach((item: any) => {
      borrowStatusStats[item._id] = item.count;
    });

    const borrowTypeStats: Record<string, number> = {};
    borrowsByType.forEach((item: any) => {
      borrowTypeStats[item._id] = item.count;
    });

    const copyStatusStats: Record<string, number> = {};
    bookCopiesByStatus.forEach((item: any) => {
      copyStatusStats[item._id] = item.count;
    });

    const reservationStatusStats: Record<string, number> = {};
    reservationsByStatus.forEach((item: any) => {
      reservationStatusStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        books: {
          overview: {
            totalBooks,
            activeBooks,
            inactiveBooks,
            newBooks: period !== 'all' ? newBooks : undefined,
            period: period !== 'all' ? period : undefined
          },
          byStatus: {
            available: statusStats['available'] || 0,
            out_of_stock: statusStats['out_of_stock'] || 0,
            discontinued: statusStats['discontinued'] || 0
          },
          byCategory: booksByCategory,
          special: {
            premiumBooks,
            newReleaseBooks
          },
          stock: {
            totalStock: stockStats[0]?.totalStock || 0,
            totalAvailable: stockStats[0]?.totalAvailable || 0,
            totalBorrowed: stockStats[0]?.totalBorrowed || 0,
            averageStock: stockStats[0]?.averageStock || 0,
            averageAvailable: stockStats[0]?.averageAvailable || 0
          },
          topBorrowedBooks,
          topRatedBooks,
          lowStockBooks,
          trends: {
            byDay: booksByDay,
            byMonth: booksByMonth
          }
        },
        borrowing: {
          overview: {
            totalBorrows,
            newBorrows: period !== 'all' ? newBorrows : undefined,
            activeBorrows: borrowStatusStats['Borrowed'] || 0,
            overdueBorrows,
            returnedBorrows: borrowStatusStats['Returned'] || 0
          },
          byStatus: borrowStatusStats,
          byType: borrowTypeStats,
          fees: {
            totalLateFee: lateFeeStats[0]?.totalLateFee || 0,
            totalDamageFee: lateFeeStats[0]?.totalDamageFee || 0,
            totalFees: lateFeeStats[0]?.totalFees || 0,
            averageLateFee: lateFeeStats[0]?.averageLateFee || 0,
            borrowsWithLateFee: lateFeeStats[0]?.borrowsWithLateFee || 0
          },
          renewals: {
            totalRenewals: renewalStats[0]?.totalRenewals || 0,
            averageRenewals: renewalStats[0]?.averageRenewals || 0,
            borrowsWithRenewals: renewalStats[0]?.borrowsWithRenewals || 0
          },
          trends: {
            byDay: borrowsByDay,
            byMonth: borrowsByMonth
          }
        },
        bookCopies: {
          total: totalBookCopies,
          byStatus: copyStatusStats
        },
        reservations: {
          total: totalReservations,
          byStatus: reservationStatusStats
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting book and borrow statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê sách và hoạt động mượn',
      error: error.message
    });
  }
};

// GET /admin/users/statistics - Thống kê người dùng
export const getUserStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'all' } = req.query; // all, today, week, month, year

    const now = new Date();
    let startDate: Date | null = null;

    // Tính ngày bắt đầu dựa trên period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    // Tổng số người dùng
    const totalUsers = await User.countDocuments();
    
    // Thống kê theo role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê theo status
    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê theo isActive
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Thống kê người dùng có membership
    const usersWithMembership = await User.countDocuments({ 
      membershipPlanId: { $exists: true, $ne: null } 
    });
    const usersWithoutMembership = totalUsers - usersWithMembership;

    // Thống kê người dùng mới theo thời gian
    const newUsersQuery: any = {};
    if (startDate) {
      newUsersQuery.createdAt = { $gte: startDate };
    }
    const newUsers = await User.countDocuments(newUsersQuery);

    // Thống kê người dùng đăng ký theo ngày (7 ngày gần nhất)
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);
    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Thống kê người dùng đăng ký theo tháng (12 tháng gần nhất)
    const last12Months = new Date(now);
    last12Months.setMonth(now.getMonth() - 12);
    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: last12Months }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Thống kê hoạt động mượn sách
    const totalBorrows = await Borrow.countDocuments();
    const activeBorrows = await Borrow.countDocuments({ 
      status: { $in: ['Borrowed', 'Overdue'] } 
    });
    const returnedBorrows = await Borrow.countDocuments({ status: 'Returned' });

    // Top 10 người dùng mượn nhiều nhất
    const topBorrowers = await Borrow.aggregate([
      {
        $group: {
          _id: '$user',
          totalBorrows: { $sum: 1 },
          activeBorrows: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Borrowed', 'Overdue']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { totalBorrows: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          role: '$userInfo.role',
          totalBorrows: 1,
          activeBorrows: 1
        }
      }
    ]);

    // Thống kê membership subscriptions
    const activeSubscriptions = await MembershipSubscription.countDocuments({ 
      status: 'Active' 
    });
    const expiredSubscriptions = await MembershipSubscription.countDocuments({ 
      status: 'Expired' 
    });

    // Thống kê người dùng có thể mượn sách
    const usersCanBorrow = await User.countDocuments({ canBorrow: true });
    const usersCannotBorrow = await User.countDocuments({ canBorrow: false });

    // Thống kê tổng chi tiêu
    const totalSpentStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' },
          maxSpent: { $max: '$totalSpent' },
          minSpent: { $min: '$totalSpent' }
        }
      }
    ]);

    // Thống kê ví
    const walletStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$walletBalance' },
          averageBalance: { $avg: '$walletBalance' },
          maxBalance: { $max: '$walletBalance' }
        }
      }
    ]);

    // Format kết quả
    const roleStats: Record<string, number> = {};
    usersByRole.forEach((item: any) => {
      roleStats[item._id] = item.count;
    });

    const statusStats: Record<string, number> = {};
    usersByStatus.forEach((item: any) => {
      statusStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          newUsers: period !== 'all' ? newUsers : undefined,
          period: period !== 'all' ? period : undefined
        },
        byRole: {
          Admin: roleStats['Admin'] || 0,
          Librarian: roleStats['Librarian'] || 0,
          Reader: roleStats['Reader'] || 0
        },
        byStatus: {
          Active: statusStats['Active'] || 0,
          Suspended: statusStats['Suspended'] || 0,
          Banned: statusStats['Banned'] || 0
        },
        membership: {
          withMembership: usersWithMembership,
          withoutMembership: usersWithoutMembership,
          activeSubscriptions,
          expiredSubscriptions
        },
        borrowing: {
          totalBorrows,
          activeBorrows,
          returnedBorrows,
          usersCanBorrow,
          usersCannotBorrow
        },
        financial: {
          totalSpent: totalSpentStats[0]?.totalSpent || 0,
          averageSpent: totalSpentStats[0]?.averageSpent || 0,
          maxSpent: totalSpentStats[0]?.maxSpent || 0,
          minSpent: totalSpentStats[0]?.minSpent || 0,
          totalWalletBalance: walletStats[0]?.totalBalance || 0,
          averageWalletBalance: walletStats[0]?.averageBalance || 0,
          maxWalletBalance: walletStats[0]?.maxBalance || 0
        },
        trends: {
          byDay: usersByDay,
          byMonth: usersByMonth
        },
        topBorrowers
      }
    });
  } catch (error: any) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng',
      error: error.message
    });
  }
};

// POST /admin/users/auto-lock-overdue - Tự động khóa quyền mượn cho user quá hạn >30 ngày
export const autoLockOverdueUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await autoLockBorrowingPermissionForOverdue();

    res.status(200).json({
      success: true,
      message: `Đã kiểm tra ${result.totalChecked} user. Khóa quyền mượn cho ${result.totalLocked} user quá hạn >30 ngày`,
      data: {
        totalChecked: result.totalChecked,
        totalLocked: result.totalLocked,
        lockedUsers: result.lockedUsers
      }
    });
  } catch (error: any) {
    console.error('Error auto-locking overdue users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tự động khóa quyền mượn cho user quá hạn',
      error: error.message
    });
  }
};

// POST /admin/users/auto-lock-penalty-debt - Tự động khóa quyền mượn khi nợ phạt vượt mức
export const autoLockPenaltyDebtUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await autoLockBorrowingPermissionForPenaltyDebt();

    res.status(200).json({
      success: true,
      message: `Đã kiểm tra ${result.totalChecked} user. Khóa quyền mượn cho ${result.totalLocked} user có nợ phạt vượt mức`,
      data: {
        totalChecked: result.totalChecked,
        totalLocked: result.totalLocked,
        lockedUsers: result.lockedUsers
      }
    });
  } catch (error: any) {
    console.error('Error auto-locking penalty debt users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tự động khóa quyền mượn cho user có nợ phạt vượt mức',
      error: error.message
    });
  }
};