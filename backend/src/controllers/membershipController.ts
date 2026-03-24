import { Request, Response } from 'express';
import MembershipPlan from '../models/MembershipPlan';
import MembershipSubscription from '../models/MembershipSubscription';
import SubscriptionHistory from '../models/SubscriptionHistory';
import MembershipRequest from '../models/MembershipRequest';
import { getActiveSubscription } from '../services/membershipService';

interface AuthRequest extends Request {
  user?: any;
}

export const listPlans = async (_req: Request, res: Response) => {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
  return res.status(200).json({ success: true, data: { plans } });
};

export const getPlanById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const plan = await MembershipPlan.findById(id);
  if (!plan || !plan.isActive) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }
  return res.status(200).json({ success: true, data: { plan } });
};

export const getMyMembership = async (req: AuthRequest, res: Response) => {
  const userId = req.user.userId;
  const sub = await getActiveSubscription(userId);
  return res.status(200).json({ success: true, data: { subscription: sub } });
};

export const getMyMembershipHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user.userId;
  const history = await SubscriptionHistory.find({ user: userId }).sort({ at: -1 }).populate('oldPlan newPlan');
  return res.status(200).json({ success: true, data: { history } });
};

export const subscribeOrSwitch = async (req: AuthRequest, res: Response) => {
  const userId = req.user.userId;
  const { membershipPlanId, notes } = req.body;

  if (!membershipPlanId) {
    return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'membershipPlanId is required' });
  }

  const plan = await MembershipPlan.findById(membershipPlanId);
  if (!plan || !plan.isActive) {
    return res.status(400).json({ success: false, code: 'PLAN_NOT_ACTIVE', message: 'Plan is not active' });
  }

  // Check if user already has active subscription with same plan
  const active = await getActiveSubscription(userId);
  if (active && String((active as any).plan._id) === String(membershipPlanId)) {
    return res.status(400).json({ success: false, code: 'RENEW_ONLY_AFTER_EXPIRY', message: 'Chỉ được gia hạn sau khi gói hiện tại hết hạn.' });
  }

  // Check if user already has pending request for this plan
  const pendingRequest = await MembershipRequest.findOne({
    user: userId,
    plan: membershipPlanId,
    status: 'Pending'
  });

  if (pendingRequest) {
    return res.status(400).json({ 
      success: false, 
      code: 'REQUEST_ALREADY_EXISTS', 
      message: 'Bạn đã có yêu cầu đăng ký gói này đang chờ xử lý' 
    });
  }

  // Create membership request
  const membershipRequest = await MembershipRequest.create({
    user: userId,
    plan: membershipPlanId,
    status: 'Pending',
    requestDate: new Date(),
    notes: notes || ''
  });

  const populatedRequest = await MembershipRequest.findById(membershipRequest._id)
    .populate('plan')
    .populate('user', 'fullName email');

  return res.status(201).json({
    success: true,
    message: 'Yêu cầu đăng ký thành viên đã được gửi. Vui lòng chờ thủ thư xác nhận.',
    data: {
      membershipRequest: populatedRequest
    }
  });
};


