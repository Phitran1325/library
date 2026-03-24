import { useState, useEffect } from 'react';
import { LuX, LuCreditCard, LuCalendar, LuCircleCheck, LuInfo } from 'react-icons/lu';
import type { Book } from '../../types';
import { borrowService } from '../../services/book.service';
import { membershipService } from '../../services/book.api';

interface BorrowBookModalProps {
    book: Book;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError?: (message: string, errors?: string[]) => void; // ✅ Optional để tái sử dụng modal
}

type BorrowType = 'Membership' | 'Rental';
type ModalStep = 'select-type' | 'rental-config' | 'processing';

const BorrowBookModal = ({ book, isOpen, onClose, onSuccess, onError }: BorrowBookModalProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [borrowType, setBorrowType] = useState<BorrowType | null>(null);
    const [modalStep, setModalStep] = useState<ModalStep>('select-type');
    const [rentalDays, setRentalDays] = useState(3);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [notes, setNotes] = useState<string>('');

    // Membership status
    const [hasMembership, setHasMembership] = useState(false);
    const [membershipLoading, setMembershipLoading] = useState(true);
    const [canBorrowWithMembership, setCanBorrowWithMembership] = useState(false);

    // Check membership status when modal opens
    useEffect(() => {
        const checkMembershipStatus = async () => {
            if (!isOpen) return;

            try {
                setMembershipLoading(true);
                const status = await membershipService.getMembershipStatus();

                console.log('🔍 [MODAL DEBUG] Full status object:', status);
                console.log('🔍 [MODAL DEBUG] status.hasMembership:', status.hasMembership);
                console.log('🔍 [MODAL DEBUG] status.canBorrow:', status.canBorrow);
                console.log('🔍 [MODAL DEBUG] status.borrowsRemaining:', status.borrowsRemaining);
                console.log('🔍 [MODAL DEBUG] Final canBorrowWithMembership:', status.canBorrow && status.borrowsRemaining > 0);

                setHasMembership(status.hasMembership);
                setCanBorrowWithMembership(status.canBorrow && status.borrowsRemaining > 0);

                console.log('🔍 [MODAL DEBUG] State updated - hasMembership:', status.hasMembership);
                console.log('🔍 [MODAL DEBUG] State updated - canBorrowWithMembership:', status.canBorrow && status.borrowsRemaining > 0);
            } catch (error) {
                console.error('Error checking membership status:', error);
                setHasMembership(false);
                setCanBorrowWithMembership(false);
            } finally {
                setMembershipLoading(false);
            }
        };

        checkMembershipStatus();
    }, [isOpen]);

    if (!isOpen) return null;

    const emitError = (message: string, errors?: string[]) => {
        if (onError) {
            onError(message, errors);
        } else {
            const detail = errors?.length ? `\n${errors.join('\n')}` : '';
            alert(`${message}${detail}`);
        }
    };

    // Reset modal
    const resetModal = () => {
        setBorrowType(null);
        setModalStep('select-type');
        setRentalDays(3);
        setPaymentId(null);
        setSuccessMessage(null);
        setLoading(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    // Calculate rental info
    const rentalInfo = book.rentalPrice
        ? borrowService.formatRentalInfo(book.rentalPrice, rentalDays)
        : null;

    // Step 1: Select borrow type
    const handleSelectBorrowType = (type: BorrowType) => {
        setBorrowType(type);
        if (type === 'Membership') {
            handleBorrowWithMembership();
        } else {
            setModalStep('rental-config');
        }
    };

    // Membership Flow: Direct borrow
    const handleBorrowWithMembership = async () => {
        try {
            const targetBookId = book._id || book.id;
            if (!targetBookId) {
                emitError('Không tìm thấy ID sách');
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const borrowing = await borrowService.borrowWithMembership(targetBookId);

            onSuccess();  // borrow thành công
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.log("❌ Error borrowing with membership:", err);

            // Axios error (response từ server)
            const apiError = err?.response?.data;

            if (apiError) {
                const message = apiError.message || "Đã xảy ra lỗi";
                const errors = Array.isArray(apiError.errors) ? apiError.errors : undefined;

                emitError(message, errors); // ✅ Already correct
                return;
            }
            // Trường hợp lỗi không từ server (lỗi JS / network)
            emitError(err.message || "Đã xảy ra lỗi không xác định");
        }
    };


    // Rental Flow Step 1: Create payment link
    const handleCreatePaymentLink = async () => {
        const targetBookId = book._id || book.id;
        if (!targetBookId) {
            emitError('Không tìm thấy ID sách');
            return;
        }

        console.log('📤 [handleSubmitRentalRequest] Starting rental borrow request');
        console.log('📤 [handleSubmitRentalRequest] bookId:', targetBookId);
        console.log('📤 [handleSubmitRentalRequest] rentalDays:', rentalDays);

        try {
            setLoading(true);

            console.log('📤 [handleSubmitRentalRequest] Calling borrowService.submitRentalBorrowRequest...');
            const result = await borrowService.submitRentalBorrowRequest(
                targetBookId,
                rentalDays
            );

            console.log('✅ [handleSubmitRentalRequest] Response:', result);

            if (result.success) {
                console.log('✅ [handleSubmitRentalRequest] Success! Borrow record created:', result.data);
                setSuccessMessage('✅ Đã gửi yêu cầu mượn sách đến thủ thư. Vui lòng chờ phê duyệt.');
                setTimeout(() => {
                    handleClose();
                    console.log('✅ [handleSubmitRentalRequest] Calling onSuccess...');
                    onSuccess();
                }, 2000);
            } else {
                console.error('❌ [handleSubmitRentalRequest] Failed:', result.message);
                emitError(result.message || 'Không thể gửi yêu cầu mượn sách');
                setModalStep('rental-config');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {

            const apiError = err?.response?.data;

            if (apiError && apiError.success === false) {
                const message = apiError.message || "Không thể hoàn tất mượn lẻ";
                const errors = Array.isArray(apiError.errors) ? apiError.errors : undefined;
                emitError(message, errors);
            } else if (err.message) {
                emitError(err.message);
            } else {
                emitError("Không thể hoàn tất mượn lẻ");
            }
        } finally {
            setLoading(false);
        }
    };

    // Rental Flow Step 2: Borrow after payment
    const handleBorrowWithRental = async (
        overridePaymentId?: string,
        options?: { skipLoading?: boolean }
    ) => {
        const effectivePaymentId = overridePaymentId || paymentId;
        if (!effectivePaymentId) {
            emitError('Không tìm thấy thông tin thanh toán');
            return;
        }

        const targetBookId = book._id || book.id;
        if (!targetBookId) {
            emitError('Không tìm thấy ID sách');
            return;
        }

        try {
            if (!options?.skipLoading) {
                setLoading(true);
            }
            setModalStep('processing');

            const result = await borrowService.borrowWithRental(
                targetBookId,
                rentalDays,
                effectivePaymentId
            );
            console.log("✅ Borrow after payment result:", result);

            setSuccessMessage('Mượn sách thành công! 🎉');

            // Wait a bit to show success message
            setTimeout(() => {
                handleClose();
                onSuccess();
            }, 1500);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {

            const apiError = err?.response?.data;
            console.log("🔍 apiError:", apiError);  // ← THÊM LOG NÀY

            if (apiError) {
                const message = apiError.message || "Đã xảy ra lỗi";
                const errors = Array.isArray(apiError.errors) ? apiError.errors : undefined;

                console.log("🔍 Calling onError with:", { message, errors });  // ← VÀ LOG NÀY

                emitError(message, errors);
                return;
            } else if (err.message) {
                emitError(err.message);
            } else {
                emitError("Không thể hoàn tất mượn sách");
            }

            setModalStep('rental-config');
        } finally {
            if (!options?.skipLoading) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold text-text">Mượn sách</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full p-1"
                    >
                        <LuX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Book Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-text mb-1">{book.title}</h3>
                        <p className="text-sm text-text-light">ISBN: {book.isbn}</p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
                            <LuCircleCheck className="w-5 h-5" />
                            <span className="font-medium">{successMessage}</span>
                        </div>
                    )}

                    {/* Loading Membership Status */}
                    {membershipLoading && modalStep === 'select-type' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-text-light text-sm">Đang kiểm tra thông tin thành viên...</p>
                        </div>
                    )}

                    {/* Step 1: Select Borrow Type */}
                    {!membershipLoading && modalStep === 'select-type' && (
                        <div className="space-y-4">
                            <p className="text-sm text-text-light mb-4">
                                Chọn hình thức mượn sách:
                            </p>

                            {/* DEBUG: Show state values */}
                            {(() => {
                                console.log('🎨 [RENDER DEBUG] hasMembership:', hasMembership);
                                console.log('🎨 [RENDER DEBUG] canBorrowWithMembership:', canBorrowWithMembership);
                                console.log('🎨 [RENDER DEBUG] loading:', loading);
                                console.log('🎨 [RENDER DEBUG] Button disabled:', loading || !canBorrowWithMembership);
                                return null;
                            })()}

                            {/* Membership Option - Only for members */}
                            {hasMembership ? (
                                <button
                                    onClick={() => handleSelectBorrowType('Membership')}
                                    disabled={loading || !canBorrowWithMembership}
                                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                                        canBorrowWithMembership
                                            ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            canBorrowWithMembership ? 'bg-purple-100' : 'bg-gray-200'
                                        }`}>
                                            <LuCircleCheck className={`w-6 h-6 ${
                                                canBorrowWithMembership ? 'text-purple-600' : 'text-gray-400'
                                            }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-text mb-1">Mượn theo gói</h4>
                                            <p className="text-sm text-text-light mb-2">
                                                Sử dụng quyền mượn từ gói thành viên
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                    Thời hạn: 14 ngày
                                                </span>
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                    Gia hạn: 2 lần
                                                </span>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                                                    Miễn phí
                                                </span>
                                            </div>
                                            {!canBorrowWithMembership && (
                                                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                                                    <LuInfo className="w-4 h-4" />
                                                    <span>Đã hết quyền mượn hoặc gói không còn hiệu lực</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <div className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <LuInfo className="w-6 h-6 text-yellow-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-text mb-1">Chưa có gói thành viên</h4>
                                            <p className="text-sm text-text-light mb-2">
                                                Bạn chưa đăng ký gói thành viên. Vui lòng đăng ký để sử dụng tính năng mượn theo gói.
                                            </p>
                                            <a
                                                href="/membership"
                                                className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Xem các gói thành viên →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rental Option - Always available */}
                            {book.rentalPrice && (
                                <button
                                    onClick={() => handleSelectBorrowType('Rental')}
                                    disabled={loading}
                                    className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <LuCreditCard className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-text mb-1">Mượn lẻ</h4>
                                            <p className="text-sm text-text-light mb-2">
                                                Thanh toán theo số ngày thuê
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                    Thời hạn: 1-7 ngày
                                                </span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                    {borrowService.formatPrice(book.rentalPrice)}/ngày
                                                </span>
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                                    Không gia hạn
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 2: Rental Config */}
                    {modalStep === 'rental-config' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <LuCalendar className="inline w-4 h-4 mr-1" />
                                    Chọn số ngày thuê (1-7 ngày)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="7"
                                    value={rentalDays}
                                    onChange={(e) => setRentalDays(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {rentalInfo && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-text-light">Giá thuê/ngày:</span>
                                        <span className="font-medium text-text">{rentalInfo.pricePerDay}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-text-light">Số ngày:</span>
                                        <span className="font-medium text-text">{rentalInfo.days} ngày</span>
                                    </div>
                                    <div className="pt-2 border-t border-blue-300 flex justify-between items-center">
                                        <span className="font-semibold text-text">Tổng cộng:</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {rentalInfo.totalPriceFormatted}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModalStep('select-type')}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={handleCreatePaymentLink}
                                    disabled={loading || rentalDays < 1 || rentalDays > 7}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Đang xử lý...' : 'Xác nhận mượn lẻ'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Processing */}
                    {modalStep === 'processing' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-text-light">Đang xử lý yêu cầu...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BorrowBookModal;












