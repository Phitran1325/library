import { Request, Response } from 'express';
import MembershipSubscription from '../models/MembershipSubscription';
import SubscriptionHistory from '../models/SubscriptionHistory';
import MembershipPlan from '../models/MembershipPlan';
import { createOrSwitchSubscription, renewAfterExpired, getActiveSubscription } from '../services/membershipService';

interface AuthRequest extends Request {
  user?: any;
}

export const listSubscriptions = async (req: AuthRequest, res: Response) => {
  const { userId, status, planId, page = 1, limit = 10 } = req.query as any;
  const skip = (Number(page) - 1) * Number(limit);
  const query: any = {};
  if (userId) query.user = userId;
  if (status) query.status = status;
  if (planId) query.plan = planId;

  const subs = await MembershipSubscription.find(query)
    .populate('user plan')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  const total = await MembershipSubscription.countDocuments(query);
  return res.status(200).json({ success: true, data: { subscriptions: subs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
};

export const listHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { status, source, email, page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query for MembershipSubscription
    const query: any = {};
    if (status) query.status = status;
    if (source) query.source = source;

    // First, get subscriptions with basic filters
    let subscriptionsQuery = MembershipSubscription.find(query)
      .populate('user', 'fullName email')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 });

    // If email filter is provided, we need to filter after population
    let items;
    if (email) {
      const allItems = await subscriptionsQuery;
      items = allItems.filter((item: any) =>
        item.user && item.user.email && item.user.email.toLowerCase().includes(email.toLowerCase())
      );
      const total = items.length;
      items = items.slice(skip, skip + Number(limit));

      return res.status(200).json({
        success: true,
        data: {
          history: items,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    }

    // Without email filter, use normal pagination
    items = await subscriptionsQuery.skip(skip).limit(Number(limit));
    const total = await MembershipSubscription.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        history: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error in listHistory:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch sử thành viên'
    });
  }
};

export const adminAssignPlan = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params as any;
  const { membershipPlanId } = req.body as any;
  const plan = await MembershipPlan.findById(membershipPlanId);
  if (!plan || !plan.isActive) {
    return res.status(400).json({ success: false, code: 'PLAN_NOT_ACTIVE', message: 'Plan is not active' });
  }

  const active = await getActiveSubscription(userId);
  if (active) {
    await createOrSwitchSubscription(userId, membershipPlanId, { previousSubscriptionId: (active as any)._id, source: 'Admin' });
  } else {
    await renewAfterExpired(userId, membershipPlanId, { source: 'Admin' });
  }

  return res.status(200).json({ success: true, message: 'Assigned membership successfully' });
};


