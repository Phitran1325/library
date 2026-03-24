
// ==================== PLAN DETAIL MODAL ====================

import { membershipService } from "@/services/book.service";
import type { MembershipPlan } from "@/types";
import { BookOpen, Calendar, Check, Clock, CreditCard, Crown, Layers, Loader2, Percent, Shield, Star, X, Zap } from "lucide-react";

interface PlanDetailModalProps {
    plan: MembershipPlan;
    onClose: () => void;
    onSubscribe: (plan: MembershipPlan) => void;
    subscribing: boolean;
}

const PlanDetailModal = ({ plan, onClose, onSubscribe, subscribing }: PlanDetailModalProps) => {
    const colors = membershipService.getPlanColor(plan.name);

    const getPlanIcon = () => {
        const iconName = membershipService.getPlanIconName(plan.name);
        switch (iconName) {
            case 'crown':
                return <Crown className="w-8 h-8 text-amber-500" />;
            case 'zap':
                return <Zap className="w-8 h-8 text-purple-500" />;
            default:
                return <Shield className="w-8 h-8 text-blue-500" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            {getPlanIcon()}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">{plan.name}</h2>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 mt-2">
                                <Clock size={14} className="mr-1" />
                                {membershipService.formatDuration(plan.duration)}
                            </span>
                        </div>
                    </div>

                    <p className="text-white/90 text-lg mb-4">
                        {plan.description}
                    </p>

                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">
                            {membershipService.formatPrice(plan.price)}
                        </span>
                        <span className="text-white/70 text-lg">
                            / {membershipService.formatDuration(plan.duration)}
                        </span>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
                    {/* Stats Grid */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <BookOpen size={20} className="text-blue-600" />
                                </div>
                                <span className="text-gray-600 font-medium">Số sách mượn tối đa</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 ml-11">
                                {plan.maxBorrows} <span className="text-base font-normal text-gray-500">sách/tháng</span>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Layers size={20} className="text-purple-600" />
                                </div>
                                <span className="text-gray-600 font-medium">Mượn đồng thời</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 ml-11">
                                {plan.maxConcurrentBorrows} <span className="text-base font-normal text-gray-500">sách</span>
                            </p>
                        </div>

                        {plan.discountRate > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Percent size={20} className="text-green-600" />
                                    </div>
                                    <span className="text-gray-600 font-medium">Giảm giá thuê</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 ml-11">
                                    {plan.discountRate}%
                                </p>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Calendar size={20} className="text-amber-600" />
                                </div>
                                <span className="text-gray-600 font-medium">Thời hạn gói</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 ml-11">
                                {plan.duration} <span className="text-base font-normal text-gray-500">tháng</span>
                            </p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star className="text-amber-500" size={24} />
                            Quyền lợi thành viên
                        </h3>

                        <div className="space-y-3">
                            {plan.features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                                        <Check size={16} className="text-green-600" />
                                    </div>
                                    <span className="text-gray-700">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600">Tổng thanh toán</span>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-gray-900">
                                {membershipService.formatPrice(plan.price)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                                ≈ {membershipService.formatPrice(membershipService.calculatePricePerDay(plan.price, plan.duration))}/ngày
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => onSubscribe(plan)}
                        disabled={subscribing}
                        className={`w-full py-3 px-6 ${colors.button} text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {subscribing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                Đăng ký ngay
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                        💳 Thanh toán an toàn qua PayOS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailModal;