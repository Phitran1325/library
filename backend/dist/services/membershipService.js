"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSubscription = getActiveSubscription;
exports.createOrSwitchSubscription = createOrSwitchSubscription;
exports.renewAfterExpired = renewAfterExpired;
const MembershipPlan_1 = __importDefault(require("../models/MembershipPlan"));
const MembershipSubscription_1 = __importDefault(require("../models/MembershipSubscription"));
const SubscriptionHistory_1 = __importDefault(require("../models/SubscriptionHistory"));
const User_1 = __importDefault(require("../models/User"));
const helpers_1 = require("../utils/helpers");
async function getActiveSubscription(userId) {
    return MembershipSubscription_1.default.findOne({ user: userId, status: 'Active' })
        .populate('plan');
}
async function createOrSwitchSubscription(userId, planId, options) {
    const plan = await MembershipPlan_1.default.findById(planId);
    if (!plan || !plan.isActive) {
        throw new Error('PLAN_NOT_ACTIVE');
    }
    const now = new Date();
    // cancel old active subscription if exists
    const current = await MembershipSubscription_1.default.findOne({ user: userId, status: 'Active' });
    if (current) {
        current.status = 'Canceled';
        await current.save();
        await SubscriptionHistory_1.default.create({
            user: current.user,
            action: 'Cancel',
            oldPlan: current.plan,
            note: 'Canceled due to switching plan'
        });
    }
    const endDate = (0, helpers_1.addMonths)(now, plan.duration);
    const newSub = await MembershipSubscription_1.default.create({
        user: userId,
        plan: planId,
        startDate: now,
        endDate,
        status: 'Active',
        source: options?.source || 'Payment',
        previousSubscriptionId: options?.previousSubscriptionId
    });
    // update user membership fields
    const user = await User_1.default.findById(userId);
    if (user) {
        user.membershipPlanId = plan._id;
        user.membershipStartDate = now;
        user.membershipEndDate = endDate;
        await user.save();
    }
    await SubscriptionHistory_1.default.create({
        user: newSub.user,
        action: options?.previousSubscriptionId ? 'Switch' : 'Subscribe',
        oldPlan: current?.plan,
        newPlan: plan._id,
        note: options?.source === 'Admin' ? 'Assigned by admin' : 'Paid via PayOS'
    });
    return newSub.populate('plan');
}
async function renewAfterExpired(userId, planId, options) {
    const plan = await MembershipPlan_1.default.findById(planId);
    if (!plan || !plan.isActive) {
        throw new Error('PLAN_NOT_ACTIVE');
    }
    const now = new Date();
    const active = await MembershipSubscription_1.default.findOne({ user: userId, status: 'Active' });
    if (active) {
        // only allow renew after expiry
        throw new Error('RENEW_ONLY_AFTER_EXPIRY');
    }
    const endDate = (0, helpers_1.addMonths)(now, plan.duration);
    const sub = await MembershipSubscription_1.default.create({
        user: userId,
        plan: planId,
        startDate: now,
        endDate,
        status: 'Active',
        source: options?.source || 'Payment'
    });
    const user = await User_1.default.findById(userId);
    if (user) {
        user.membershipPlanId = plan._id;
        user.membershipStartDate = now;
        user.membershipEndDate = endDate;
        await user.save();
    }
    await SubscriptionHistory_1.default.create({
        user: sub.user,
        action: 'Renew',
        newPlan: plan._id,
        note: options?.source === 'Admin' ? 'Renewed by admin' : 'Paid via PayOS'
    });
    return sub.populate('plan');
}
//# sourceMappingURL=membershipService.js.map