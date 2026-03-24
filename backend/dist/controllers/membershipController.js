"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeOrSwitch = exports.getMyMembershipHistory = exports.getMyMembership = exports.getPlanById = exports.listPlans = void 0;
const MembershipPlan_1 = __importDefault(require("../models/MembershipPlan"));
const SubscriptionHistory_1 = __importDefault(require("../models/SubscriptionHistory"));
const payosService_1 = require("../services/payment/payosService");
const membershipService_1 = require("../services/membershipService");
const listPlans = async (_req, res) => {
    const plans = await MembershipPlan_1.default.find({ isActive: true }).sort({ price: 1 });
    return res.status(200).json({ success: true, data: { plans } });
};
exports.listPlans = listPlans;
const getPlanById = async (req, res) => {
    const { id } = req.params;
    const plan = await MembershipPlan_1.default.findById(id);
    if (!plan || !plan.isActive) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    return res.status(200).json({ success: true, data: { plan } });
};
exports.getPlanById = getPlanById;
const getMyMembership = async (req, res) => {
    const userId = req.user.userId;
    const sub = await (0, membershipService_1.getActiveSubscription)(userId);
    return res.status(200).json({ success: true, data: { subscription: sub } });
};
exports.getMyMembership = getMyMembership;
const getMyMembershipHistory = async (req, res) => {
    const userId = req.user.userId;
    const history = await SubscriptionHistory_1.default.find({ user: userId }).sort({ at: -1 }).populate('oldPlan newPlan');
    return res.status(200).json({ success: true, data: { history } });
};
exports.getMyMembershipHistory = getMyMembershipHistory;
const subscribeOrSwitch = async (req, res) => {
    const userId = req.user.userId;
    const { membershipPlanId } = req.body;
    if (!membershipPlanId) {
        return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'membershipPlanId is required' });
    }
    const plan = await MembershipPlan_1.default.findById(membershipPlanId);
    if (!plan || !plan.isActive) {
        return res.status(400).json({ success: false, code: 'PLAN_NOT_ACTIVE', message: 'Plan is not active' });
    }
    // Rules: 
    // - If user has active subscription with same plan -> not allowed (renew only after expiry)
    const active = await (0, membershipService_1.getActiveSubscription)(userId);
    if (active && String(active.plan._id) === String(membershipPlanId)) {
        return res.status(400).json({ success: false, code: 'RENEW_ONLY_AFTER_EXPIRY', message: 'Chỉ được gia hạn sau khi gói hiện tại hết hạn.' });
    }
    // Create PayOS payment link (no debt allowed). Discount logic can be added here.
    const { providerRef, checkoutUrl, expiresAt } = await (0, payosService_1.createPayOSPaymentLink)({
        userId,
        type: 'Membership',
        planId: membershipPlanId,
        amount: plan.price,
        description: `Subscription for ${plan.name}`,
        metadata: { action: active ? 'Switch' : 'Subscribe' }
    });
    return res.status(200).json({
        success: true,
        data: {
            payment: {
                provider: 'PayOS',
                providerRef,
                checkoutUrl,
                expiresAt
            }
        }
    });
};
exports.subscribeOrSwitch = subscribeOrSwitch;
//# sourceMappingURL=membershipController.js.map