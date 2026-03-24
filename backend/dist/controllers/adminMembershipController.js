"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAssignPlan = exports.listHistory = exports.listSubscriptions = void 0;
const MembershipSubscription_1 = __importDefault(require("../models/MembershipSubscription"));
const SubscriptionHistory_1 = __importDefault(require("../models/SubscriptionHistory"));
const MembershipPlan_1 = __importDefault(require("../models/MembershipPlan"));
const membershipService_1 = require("../services/membershipService");
const listSubscriptions = async (req, res) => {
    const { userId, status, planId, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (userId)
        query.user = userId;
    if (status)
        query.status = status;
    if (planId)
        query.plan = planId;
    const subs = await MembershipSubscription_1.default.find(query)
        .populate('user plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await MembershipSubscription_1.default.countDocuments(query);
    return res.status(200).json({ success: true, data: { subscriptions: subs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
};
exports.listSubscriptions = listSubscriptions;
const listHistory = async (req, res) => {
    const { userId, action, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (userId)
        query.user = userId;
    if (action)
        query.action = action;
    const items = await SubscriptionHistory_1.default.find(query).populate('oldPlan newPlan user').sort({ at: -1 }).skip(skip).limit(Number(limit));
    const total = await SubscriptionHistory_1.default.countDocuments(query);
    return res.status(200).json({ success: true, data: { history: items, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } });
};
exports.listHistory = listHistory;
const adminAssignPlan = async (req, res) => {
    const { userId } = req.params;
    const { membershipPlanId } = req.body;
    const plan = await MembershipPlan_1.default.findById(membershipPlanId);
    if (!plan || !plan.isActive) {
        return res.status(400).json({ success: false, code: 'PLAN_NOT_ACTIVE', message: 'Plan is not active' });
    }
    const active = await (0, membershipService_1.getActiveSubscription)(userId);
    if (active) {
        await (0, membershipService_1.createOrSwitchSubscription)(userId, membershipPlanId, { previousSubscriptionId: active._id, source: 'Admin' });
    }
    else {
        await (0, membershipService_1.renewAfterExpired)(userId, membershipPlanId, { source: 'Admin' });
    }
    return res.status(200).json({ success: true, message: 'Assigned membership successfully' });
};
exports.adminAssignPlan = adminAssignPlan;
//# sourceMappingURL=adminMembershipController.js.map