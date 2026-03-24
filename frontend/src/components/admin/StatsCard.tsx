import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  color?: 'default' | 'blue' | 'green' | 'red' | 'yellow';
  isHovered?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  color = 'default', 
  isHovered = false,
  onClick 
}) => {
  const colorClasses = {
    default: 'text-gray-800',
    blue: 'text-blue-600 border-blue-200',
    green: 'text-green-600 border-green-200',
    red: 'text-red-600 border-red-200',
    yellow: 'text-yellow-600 border-yellow-200'
  };

  return (
    <div 
      className={`bg-white rounded-lg p-6 shadow-sm border-2 transition-all duration-200 cursor-pointer ${
        isHovered ? 'shadow-md transform scale-105' : 'hover:shadow-md'
      } ${colorClasses[color]}`}
      onClick={onClick}
    >
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default StatsCard;
