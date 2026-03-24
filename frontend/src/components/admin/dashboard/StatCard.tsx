import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    title: string;
    value: number;
    subtitle: string;
    subtitleValue: number;
    subtitleColor: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
    title,
    value,
    subtitle,
    subtitleValue,
    subtitleColor,
    onMouseEnter,
    onMouseLeave,
}) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-sm border ${borderColor} p-6 hover:shadow-md transition-all duration-300 cursor-pointer`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 ${bgColor} rounded-lg`}>
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {subtitle}: <span className={`font-semibold ${subtitleColor}`}>{subtitleValue}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
