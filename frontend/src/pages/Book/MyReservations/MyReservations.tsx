import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReservations, cancelReservation } from '../../../services/book.api';
import { LuNotebookPen } from "react-icons/lu";
import { type Reservation } from '../../../types';
import ReservationCard from './ReservationCard';
import useNotification from '@/hooks/userNotification';

const MyReservations = () => {
    type TabKey = 'all' | 'pending' | 'ready' | 'completed' | 'cancelled';

    const navigate = useNavigate();
    const [allReservations, setAllReservations] = useState<Reservation[]>([]); // Store ALL reservations
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showSuccess, showError } = useNotification();
    const itemsPerPage = 10;

    // Định nghĩa tabs với type
    const tabs: Array<{ key: TabKey; label: string }> = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Đang chờ' },
        { key: 'ready', label: 'Sẵn sàng' },
        { key: 'completed', label: 'Hoàn tất' },
        { key: 'cancelled', label: 'Đã hủy' },
    ];

    useEffect(() => {
        fetchReservations();
    }, []); // Fetch once on mount

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch ALL reservations (backend doesn't paginate properly)
            const data = await getMyReservations(1, 1000);
            console.log('✅ Fetched all reservations:', data.reservations.length);

            setAllReservations(data.reservations);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách đặt trước');
            showError(err instanceof Error ? err.message : 'Không thể tải danh sách đặt trước')
        } finally {
            setLoading(false);
        }
    };

    // Filter by tab status
    const filteredReservations = useMemo(() => {
        let filtered: Reservation[];

        switch (activeTab) {
            case 'pending':
                filtered = allReservations.filter(r => r.status === 'Pending');
                break;
            case 'ready':
                filtered = allReservations.filter(r => r.status === 'Ready');
                break;
            case 'completed':
                filtered = allReservations.filter(r => r.status === 'Completed');
                break;
            case 'cancelled':
                filtered = allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired');
                break;
            default:
                filtered = allReservations;
        }

        return filtered;
    }, [allReservations, activeTab]);

    // Paginate filtered results
    const paginatedReservations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredReservations.slice(startIndex, endIndex);
    }, [filteredReservations, currentPage, itemsPerPage]);

    // Calculate total pages based on filtered results
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

    // Reset to page 1 when changing tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleCancel = async (id: string) => {
        setActionLoading(id);
        try {
            await cancelReservation(id);
            showSuccess('Hủy đặt trước thành công!');
            await fetchReservations();
        } catch (err) {
            console.error('Cancel error:', err);
            // toast.error(err instanceof Error ? err.message : 'Không thể hủy đặt trước');
            showError(err instanceof Error ? err.message : 'Không thể hủy đặt trước');
        } finally {
            setActionLoading(null);
        }
    };

    const handleNavigate = (bookId: string) => {
        navigate(`/books/${bookId}`);
    };

    if (loading && allReservations.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <LuNotebookPen className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold text-gray-900">Sách Đã Đặt Trước</h1>
                </div>
                <p className="text-gray-600 ml-11">Quản lý sách bạn đã đặt và chờ lấy</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="relative px-6 py-4 text-sm font-medium transition-colors group"
                        >
                            <span className={activeTab === tab.key ? 'text-primary' : 'text-gray-600 group-hover:text-gray-900'}>
                                {tab.label} ({
                                    tab.key === 'all'
                                        ? allReservations.length
                                        : tab.key === 'cancelled'
                                            ? allReservations.filter(r => r.status === 'Cancelled' || r.status === 'Expired').length
                                            : allReservations.filter(r => r.status.toLowerCase() === tab.key).length
                                })
                            </span>
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Reservation List */}
            {paginatedReservations.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {activeTab === 'all'
                            ? 'Chưa có sách nào được đặt trước'
                            : 'Không có sách trong trạng thái này'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Hãy duyệt thư viện và đặt trước những cuốn sách bạn muốn đọc!
                    </p>
                    <button
                        onClick={() => navigate('/books')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Khám phá thư viện
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {paginatedReservations.map(reservation => (
                        <div
                            key={reservation._id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex gap-6">
                                {/* Book Image - Updated to match MyBorrows style */}
                                <div
                                    onClick={() => handleNavigate(reservation.book._id)}
                                    className="w-32 h-44 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                                >
                                    {reservation.book.image || reservation.book.coverImage ? (
                                        <img
                                            src={reservation.book.image || reservation.book.coverImage}
                                            alt={reservation.book.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <LuNotebookPen className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Book Info */}
                                <ReservationCard
                                    reservation={reservation}
                                    onCancel={handleCancel}
                                    onNavigate={handleNavigate}
                                    actionLoading={actionLoading}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 border rounded-lg transition-colors ${currentPage === page
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyReservations;