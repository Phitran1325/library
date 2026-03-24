import { Request, Response } from 'express';
import MembershipRequest from '../models/MembershipRequest';
import { createOrSwitchSubscription, renewAfterExpired, getActiveSubscription } from '../services/membershipService';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get all membership requests (for librarians)
 * GET /api/librarian/membership-requests
 */
export const listMembershipRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const requests = await MembershipRequest.find(query)
      .populate('user', 'fullName email phoneNumber')
      .populate('plan')
      .populate('processedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await MembershipRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error in listMembershipRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách yêu cầu',
      error: error.message
    });
  }
};

/**
 * Get a single membership request by ID
 * GET /api/librarian/membership-requests/:id
 */
export const getMembershipRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await MembershipRequest.findById(id)
      .populate('user', 'fullName email phoneNumber address')
      .populate('plan')
      .populate('processedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    return res.status(200).json({
      success: true,
      data: { request }
    });
  } catch (error: any) {
    console.error('Error in getMembershipRequestById:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin yêu cầu',
      error: error.message
    });
  }
};

/**
 * Approve a membership request
 * POST /api/librarian/membership-requests/:id/approve
 */
export const approveMembershipRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const librarianId = req.user.userId;
    const { notes } = req.body;

    // Check if librarian exists and has correct role
    const librarian = await User.findById(librarianId);
    if (!librarian || (librarian.role !== 'Librarian' && librarian.role !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ thủ thư hoặc admin mới có quyền duyệt yêu cầu'
      });
    }

    const request = await MembershipRequest.findById(id).populate('plan').populate('user');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể duyệt yêu cầu đang ở trạng thái Pending'
      });
    }

    // Check if plan is still active
    const plan = request.plan as any;
    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Gói thành viên này không còn hoạt động'
      });
    }

    // Create or switch subscription
    const userId = String((request.user as any)._id);
    const planId = String((request.plan as any)._id);
    
    const activeSubscription = await getActiveSubscription(userId);
    
    if (activeSubscription) {
      await createOrSwitchSubscription(userId, planId, {
        previousSubscriptionId: (activeSubscription as any)._id,
        source: 'Admin'
      });
    } else {
      await renewAfterExpired(userId, planId, { source: 'Admin' });
    }

    // Update request status
    request.status = 'Approved';
    request.processedBy = librarianId as any;
    request.processedAt = new Date();
    if (notes) {
      request.notes = (request.notes || '') + '\n[Librarian]: ' + notes;
    }
    await request.save();

    const updatedRequest = await MembershipRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('plan')
      .populate('processedBy', 'fullName email');

    return res.status(200).json({
      success: true,
      message: 'Đã duyệt yêu cầu đăng ký thành viên thành công',
      data: { request: updatedRequest }
    });
  } catch (error: any) {
    console.error('Error in approveMembershipRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể duyệt yêu cầu',
      error: error.message
    });
  }
};

/**
 * Reject a membership request
 * POST /api/librarian/membership-requests/:id/reject
 */
export const rejectMembershipRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const librarianId = req.user.userId;
    const { reason, notes } = req.body;

    // Check if librarian exists and has correct role
    const librarian = await User.findById(librarianId);
    if (!librarian || (librarian.role !== 'Librarian' && librarian.role !== 'Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ thủ thư hoặc admin mới có quyền từ chối yêu cầu'
      });
    }

    const request = await MembershipRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể từ chối yêu cầu đang ở trạng thái Pending'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do từ chối'
      });
    }

    // Update request status
    request.status = 'Rejected';
    request.processedBy = librarianId as any;
    request.processedAt = new Date();
    request.rejectionReason = reason;
    if (notes) {
      request.notes = (request.notes || '') + '\n[Librarian]: ' + notes;
    }
    await request.save();

    const updatedRequest = await MembershipRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('plan')
      .populate('processedBy', 'fullName email');

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối yêu cầu đăng ký thành viên',
      data: { request: updatedRequest }
    });
  } catch (error: any) {
    console.error('Error in rejectMembershipRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể từ chối yêu cầu',
      error: error.message
    });
  }
};

/**
 * Get membership requests for current user
 * GET /api/memberships/my-requests
 */
export const getMyMembershipRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const requests = await MembershipRequest.find({ user: userId })
      .populate('plan')
      .populate('processedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await MembershipRequest.countDocuments({ user: userId });

    return res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error in getMyMembershipRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách yêu cầu',
      error: error.message
    });
  }
};
