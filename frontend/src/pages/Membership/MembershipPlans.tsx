// src/pages/Membership/MembershipPlans.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Crown,
    Shield,
    Zap,
    Check,
    ArrowRight,
    Loader2,
    BookOpen,
    Layers,
    Calendar,
    Percent,
    Clock,
    Star
} from 'lucide-react';
import { membershipService } from '../../services/book.service';
import type { MembershipPlan } from '@/types';
import useNotification from '@/hooks/userNotification';
import PlanDetailModal from './PlanDetailModal';

const MembershipPlans = () => {
    const navigate = useNavigate();
    const { showError, showInfo } = useNotification();

    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await membershipService.getAllPlans();
            setPlans(data);
        } catch (err) {
            console.error('Error fetching plans:', err);
            showError('Không thể tải danh sách gói thành viên');
        } finally {
            setLoading(false);
        }
    };

    const getPlanIcon = (planName: string) => {
        const iconName = membershipService.getPlanIconName(planName);
        const iconClass = "w-12 h-12";

        switch (iconName) {
            case 'crown':
                return <Crown className={`${iconClass} text-amber-500`} />;
            case 'zap':
                return <Zap className={`${iconClass} text-purple-500`} />;
            default:
                return <Shield className={`${iconClass} text-blue-500`} />;
        }
    };

    const handleViewDetails = (plan: MembershipPlan) => {
        setSelectedPlan(plan);
    };

    const handleCloseModal = () => {
        setSelectedPlan(null);
    };

    const handleSubscribe = async (plan: MembershipPlan) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showInfo('Vui lòng đăng nhập để đăng ký gói thành viên');
            navigate('/login', { state: { from: '/membership' } });
            return;
        }

        try {
            setSubscribing(true);
            const result = await membershipService.subscribe(plan._id);

            if (result.paymentLink) {
                window.location.href = result.paymentLink;
            }
        } catch (err) {
            console.error('Subscribe error:', err);
            showError(err instanceof Error ? err.message : 'Không thể đăng ký gói thành viên');
        } finally {
            setSubscribing(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-gray-600">Đang tải gói thành viên...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Gói Thành Viên
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Trở thành thành viên để tận hưởng các đặc quyền mượn sách và nhiều ưu đãi hấp dẫn
                    </p>
                </div>

                {/* Plans Grid - Responsive based on number of plans */}
                {plans.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có gói thành viên
                        </h3>
                        <p className="text-gray-600">
                            Hiện tại chưa có gói thành viên nào được kích hoạt
                        </p>
                    </div>
                ) : (
                    <div className={`grid gap-8 ${plans.length === 1
                        ? 'max-w-xl mx-auto'
                        : plans.length === 2
                            ? 'md:grid-cols-2 max-w-4xl mx-auto'
                            : 'md:grid-cols-2 lg:grid-cols-3'
                        }`}>
                        {plans.map((plan) => {
                            const colors = membershipService.getPlanColor(plan.name);

                            return (
                                <div
                                    key={plan._id}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                                >
                                    {/* Header với gradient */}
                                    <div className={`bg-gradient-to-r ${colors.bg} p-6 text-white`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                {getPlanIcon(plan.name)}
                                            </div>
                                            {plan.discountRate > 0 && (
                                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                                    -{plan.discountRate}%
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold">
                                                {membershipService.formatPrice(plan.price)}
                                            </span>
                                            <span className="text-white/80">
                                                /{membershipService.formatDuration(plan.duration)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-6 line-clamp-2">
                                            {plan.description}
                                        </p>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="flex items-center gap-2 text-sm">
                                                <BookOpen className="w-4 h-4 text-blue-600" />
                                                <span className="text-gray-700">{plan.maxBorrows} sách/tháng</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Layers className="w-4 h-4 text-purple-600" />
                                                <span className="text-gray-700">{plan.maxConcurrentBorrows} đồng thời</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-amber-600" />
                                                <span className="text-gray-700">{plan.duration} ngày</span>
                                            </div>
                                            {plan.discountRate > 0 && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Percent className="w-4 h-4 text-green-600" />
                                                    <span className="text-gray-700">-{plan.discountRate}%</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Features Preview */}
                                        <div className="space-y-2 mb-6">
                                            {plan.features.slice(0, 3).map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700 line-clamp-1">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                            {plan.features.length > 3 && (
                                                <p className="text-sm text-gray-500 italic">
                                                    +{plan.features.length - 3} quyền lợi khác
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleViewDetails(plan)}
                                                className="w-full px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 group"
                                            >
                                                <span>Xem chi tiết</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>

                                            <button
                                                onClick={() => handleSubscribe(plan)}
                                                disabled={subscribing}
                                                className={`w-full px-4 py-3 ${colors.button} text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {subscribing ? 'Đang xử lý...' : 'Đăng ký ngay'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        Tại sao nên trở thành thành viên?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Mượn Sách Dễ Dàng</h3>
                            <p className="text-gray-600 text-sm">
                                Truy cập kho sách phong phú với hàng nghìn đầu sách
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Ưu Đãi Đặc Biệt</h3>
                            <p className="text-gray-600 text-sm">
                                Tiết kiệm dành riêng cho thành viên
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Linh Hoạt Thời Gian</h3>
                            <p className="text-gray-600 text-sm">
                                Gia hạn dễ dàng và thời gian mượn linh hoạt
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedPlan && (
                <PlanDetailModal
                    plan={selectedPlan}
                    onClose={handleCloseModal}
                    onSubscribe={handleSubscribe}
                    subscribing={subscribing}
                />
            )}
        </div>
    );
};


export default MembershipPlans;