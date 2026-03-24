import { Star, Users } from "lucide-react";
import { FaBookReader } from "react-icons/fa";
import { TbBooks } from "react-icons/tb";
import { useState, useEffect } from 'react';
import { getDashboardStatistics } from '@/services/book.api';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useCountUp } from '@/hooks/useCountUp';

interface StatisticsData {
    totalBooks: number;
    totalReaders: number;
    totalBorrowsLast30Days: number;
    averageRating: number;
}

interface AnimatedNumberProps {
    value: number;
    isVisible: boolean;
    formatFn?: (num: number) => string;
    suffix?: string;
}

const AnimatedNumber = ({ value, isVisible, formatFn, suffix = '' }: AnimatedNumberProps) => {
    const count = useCountUp(value, 2000, isVisible);

    if (formatFn) {
        return <>{formatFn(count)}{suffix}</>;
    }

    return <>{count}{suffix}</>;
};

const LibraryStats = () => {
    const [stats, setStats] = useState<StatisticsData>({
        totalBooks: 0,
        totalReaders: 0,
        totalBorrowsLast30Days: 0,
        averageRating: 0,
    });
    const [loading, setLoading] = useState(true);

    // Intersection Observer
    const [containerRef, isVisible] = useIntersectionObserver({
        threshold: 0.2,
        freezeOnceVisible: true,
    });

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const data = await getDashboardStatistics();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    // Format number with thousands separator
    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K+`;
        }
        return num.toString();
    };

    const libraryStats = [
        {
            icon: <TbBooks size={40} />,
            value: stats.totalBooks,
            formatFn: formatNumber,
            label: 'Đầu sách',
            delay: 0,
        },
        {
            icon: <Users size={40} />,
            value: stats.totalReaders,
            formatFn: formatNumber,
            label: 'Thành viên',
            delay: 100,
        },
        {
            icon: <FaBookReader size={40} />,
            value: stats.totalBorrowsLast30Days,
            formatFn: formatNumber,
            label: 'Lượt mượn/tháng',
            delay: 200,
        },
        {
            icon: <Star size={40} />,
            value: stats.averageRating,
            formatFn: (num: number) => num.toFixed(1),
            suffix: '/5',
            label: 'Đánh giá',
            delay: 300,
        }
    ];

    return (
        <div
            ref={containerRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
            {libraryStats.map((stat, index) => (
                <div
                    key={index}
                    className={`bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer
                        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                        transition-all duration-700 ease-out`}
                    style={{
                        transitionDelay: `${stat.delay}ms`,
                    }}
                >
                    <div className="text-primary mb-3 flex justify-center">
                        {stat.icon}
                    </div>

                    <div className="text-2xl font-bold text-primary mb-1">
                        {loading ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <AnimatedNumber
                                value={stat.value}
                                isVisible={isVisible && !loading}
                                formatFn={stat.formatFn}
                                suffix={stat.suffix}
                            />
                        )}
                    </div>

                    <div className="text-sm text-text-light">{stat.label}</div>
                </div>
            ))}
        </div>
    );
};

export default LibraryStats;