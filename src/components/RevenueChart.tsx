import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

export const RevenueChart: React.FC = () => {
  // Mock data for the chart
  const weeklyData = [
    { day: 'Mon', revenue: 450 },
    { day: 'Tue', revenue: 620 },
    { day: 'Wed', revenue: 380 },
    { day: 'Thu', revenue: 710 },
    { day: 'Fri', revenue: 890 },
    { day: 'Sat', revenue: 340 },
    { day: 'Sun', revenue: 280 }
  ];

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="text-green-600 dark:text-green-400" size={20} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Revenue</h3>
        <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
          <TrendingUp size={16} />
          <span>+12.5%</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-32 mb-4">
        {weeklyData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="bg-green-500 dark:bg-green-600 rounded-t w-full min-h-[4px] transition-all duration-300 hover:bg-green-600 dark:hover:bg-green-500"
              style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
              title={`$${data.revenue}`}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.day}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">This Week: $3,670</span>
        <span className="text-green-600 dark:text-green-400 font-medium">+$410</span>
      </div>
    </div>
  );
};