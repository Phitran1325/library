"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMembershipRequests = exports.rejectMembershipRequest = exports.approveMembershipRequest = exports.getMembershipRequestById = exports.listMembershipRequests = void 0;
const MembershipRequest_1 = __importDefault(require("../models/MembershipRequest"));
const membershipService_1 = require("../services/membershipService");
const User_1 = __importDefault(require("../models/User"));
/**
 * Get all membership requests (for librarians)
 * GET /api/librarian/membership-requests
 */
const listMembershipRequests = async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};
        if (status)
            query.status = status;
        if (userId)
            query.user = userId;
        const requests = await MembershipRequest_1.default.find(query)
            .populate('user', 'fullName email phoneNumber')
            .populate('plan')
            .populate('processedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await MembershipRequest_1.default.countDocuments(query);
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
    }
    catch (error) {
        console.error('Error in listMembershipRequests:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách yêu cầu',
            error: error.message
        });
    }
};
exports.listMembershipRequests = listMembershipRequests;
/**
 * Get a single membership request by ID
 * GET /api/librarian/membership-requests/:id
 */
const getMembershipRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await MembershipRequest_1.default.findById(id)
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
    }
    catch (error) {
        console.error('Error in getMembershipRequestById:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin yêu cầu',
            error: error.message
        });
    }
};
exports.getMembershipRequestById = getMembershipRequestById;
/**
 * Approve a membership request
 * POST /api/librarian/membership-requests/:id/approve
 */
const approveMembershipRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const librarianId = req.user.userId;
        const { notes } = req.body;
        // Check if librarian exists and has correct role
        const librarian = await User_1.default.findById(librarianId);
        if (!librarian || (librarian.role !== 'Librarian' && librarian.role !== 'Admin')) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ thủ thư hoặc admin mới có quyền duyệt yêu cầu'
            });
        }
        const request = await MembershipRequest_1.default.findById(id).populate('plan').populate('user');
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
        const plan = request.plan;
        if (!plan.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Gói thành viên này không còn hoạt động'
            });
        }
        // Create or switch subscription
        const userId = String(request.user._id);
        const planId = String(request.plan._id);
        const activeSubscription = await (0, membershipService_1.getActiveSubscription)(userId);
        if (activeSubscription) {
            await (0, membershipService_1.createOrSwitchSubscription)(userId, planId, {
                previousSubscriptionId: activeSubscription._id,
                source: 'Admin'
            });
        }
        else {
            await (0, membershipService_1.renewAfterExpired)(userId, planId, { source: 'Admin' });
        }
        // Update request status
        request.status = 'Approved';
        request.processedBy = librarianId;
        request.processedAt = new Date();
        if (notes) {
            request.notes = (request.notes || '') + '\n[Librarian]: ' + notes;
        }
        await request.save();
        const updatedRequest = await MembershipRequest_1.default.findById(id)
            .populate('user', 'fullName email')
            .populate('plan')
            .populate('processedBy', 'fullName email');
        return res.status(200).json({
            success: true,
            message: 'Đã duyệt yêu cầu đăng ký thành viên thành công',
            data: { request: updatedRequest }
        });
    }
    catch (error) {
        console.error('Error in approveMembershipRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể duyệt yêu cầu',
            error: error.message
        });
    }
};
exports.approveMembershipRequest = approveMembershipRequest;
/**
 * Reject a membership request
 * POST /api/librarian/membership-requests/:id/reject
 */
const rejectMembershipRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const librarianId = req.user.userId;
        const { reason, notes } = req.body;
        // Check if librarian exists and has correct role
        const librarian = await User_1.default.findById(librarianId);
        if (!librarian || (librarian.role !== 'Librarian' && librarian.role !== 'Admin')) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ thủ thư hoặc admin mới có quyền từ chối yêu cầu'
            });
        }
        const request = await MembershipRequest_1.default.findById(id);
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
        request.processedBy = librarianId;
        request.processedAt = new Date();
        request.rejectionReason = reason;
        if (notes) {
            request.notes = (request.notes || '') + '\n[Librarian]: ' + notes;
        }
        await request.save();
        const updatedRequest = await MembershipRequest_1.default.findById(id)
            .populate('user', 'fullName email')
            .populate('plan')
            .populate('processedBy', 'fullName email');
        return res.status(200).json({
            success: true,
            message: 'Đã từ chối yêu cầu đăng ký thành viên',
            data: { request: updatedRequest }
        });
    }
    catch (error) {
        console.error('Error in rejectMembershipRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể từ chối yêu cầu',
            error: error.message
        });
    }
};
exports.rejectMembershipRequest = rejectMembershipRequest;
/**
 * Get membership requests for current user
 * GET /api/memberships/my-requests
 */
const getMyMembershipRequests = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const requests = await MembershipRequest_1.default.find({ user: userId })
            .populate('plan')
            .populate('processedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await MembershipRequest_1.default.countDocuments({ user: userId });
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
    }
    catch (error) {
        console.error('Error in getMyMembershipRequests:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách yêu cầu',
            error: error.message
        });
    }
};
exports.getMyMembershipRequests = getMyMembershipRequests;
//# sourceMappingURL=librarianMembershipController.js.map