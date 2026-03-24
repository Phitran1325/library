import MembershipPlan from '../models/MembershipPlan';
import mongoose from 'mongoose';
import MembershipSubscription from '../models/MembershipSubscription';
import SubscriptionHistory from '../models/SubscriptionHistory';
import User from '../models/User';
import { addMonths } from '../utils/helpers';

export async function getActiveSubscription(userId: string) {
  return MembershipSubscription.findOne({ user: userId, status: 'Active' })
    .populate('plan');
}

export async function createOrSwitchSubscription(userId: string, planId: string, options?: { previousSubscriptionId?: string; source?: 'Payment' | 'Admin' }) {
  const plan = await MembershipPlan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new Error('PLAN_NOT_ACTIVE');
  }

  const now = new Date();

  // cancel old active subscription if exists
  const current = await MembershipSubscription.findOne({ user: userId, status: 'Active' });
  if (current) {
    current.status = 'Canceled';
    await current.save();
    await SubscriptionHistory.create({
      user: current.user,
      action: 'Cancel',
      oldPlan: current.plan,
      note: 'Canceled due to switching plan'
    });
  }

  const endDate = addMonths(now, plan.duration);
  const newSub = await MembershipSubscription.create({
    user: userId,
    plan: planId,
    startDate: now,
    endDate,
    status: 'Active',
    source: options?.source || 'Payment',
    previousSubscriptionId: options?.previousSubscriptionId
  });

  // update user membership fields
  const user = await User.findById(userId);
  if (user) {
    user.membershipPlanId = plan._id as unknown as mongoose.Types.ObjectId;
    user.membershipStartDate = now;
    user.membershipEndDate = endDate;
    await user.save();
  }

  await SubscriptionHistory.create({
    user: newSub.user,
    action: options?.previousSubscriptionId ? 'Switch' : 'Subscribe',
    oldPlan: current?.plan,
    newPlan: plan._id,
    note: options?.source === 'Admin' ? 'Assigned by admin' : 'Paid via PayOS'
  });

  return newSub.populate('plan');
}

export async function renewAfterExpired(userId: string, planId: string, options?: { source?: 'Payment' | 'Admin' }) {
  const plan = await MembershipPlan.findById(planId);
  if (!plan || !plan.isActive) {
    throw new Error('PLAN_NOT_ACTIVE');
  }

  const now = new Date();
  const active = await MembershipSubscription.findOne({ user: userId, status: 'Active' });
  if (active) {
    // only allow renew after expiry
    throw new Error('RENEW_ONLY_AFTER_EXPIRY');
  }

  const endDate = addMonths(now, plan.duration);
  const sub = await MembershipSubscription.create({
    user: userId,
    plan: planId,
    startDate: now,
    endDate,
    status: 'Active',
    source: options?.source || 'Payment'
  });

  const user = await User.findById(userId);
  if (user) {
    user.membershipPlanId = plan._id as unknown as mongoose.Types.ObjectId;
    user.membershipStartDate = now;
    user.membershipEndDate = endDate;
    await user.save();
  }

  await SubscriptionHistory.create({
    user: sub.user,
    action: 'Renew',
    newPlan: plan._id,
    note: options?.source === 'Admin' ? 'Renewed by admin' : 'Paid via PayOS'
  });

  return sub.populate('plan');
}


