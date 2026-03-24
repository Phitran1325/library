"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const paymentSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['Membership', 'Rental', 'Debt'], required: true, index: true },
    plan: { type: mongoose_1.Schema.Types.ObjectId, ref: 'MembershipPlan' },
    book: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Book' },
    rentalDays: { type: Number, min: 1, max: 7 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'VND' },
    provider: { type: String, enum: ['PayOS'], required: true },
    providerRef: { type: String, required: true, unique: true },
    checkoutUrl: { type: String },
    status: { type: String, enum: ['Pending', 'Succeeded', 'Failed', 'Canceled'], default: 'Pending', index: true },
    expiresAt: { type: Date },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true
});
paymentSchema.index({ provider: 1, providerRef: 1 }, { unique: true });
paymentSchema.index({ user: 1, type: 1, status: 1 });
paymentSchema.index({ type: 1, plan: 1 });
paymentSchema.index({ type: 1, book: 1 });
const Payment = mongoose_1.default.model('Payment', paymentSchema);
exports.default = Payment;
//# sourceMappingURL=Payment.js.map