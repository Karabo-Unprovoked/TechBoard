import React from 'react';
import { Video as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    text: 'text-green-600 dark:text-green-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    text: 'text-purple-600 dark:text-purple-400'
  }
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color 
}) => {
  const classes = colorClasses[color];
  
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className={`${classes.bg} rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm font-medium ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${classes.icon} rounded-lg p-2 sm:p-3 flex-shrink-0 ml-2`}>
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};