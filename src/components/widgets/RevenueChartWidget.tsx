import React, { useMemo } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import type { RepairTicket } from '../../lib/supabase';

interface RevenueChartWidgetProps {
  tickets: RepairTicket[];
}

export const RevenueChartWidget: React.FC<RevenueChartWidgetProps> = ({ tickets }) => {
  const revenueData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: 0,
      };
    });

    tickets.forEach(ticket => {
      if (ticket.status === 'completed' && ticket.actual_cost) {
        const ticketDate = new Date(ticket.created_at);
        const monthIndex = last6Months.findIndex(m => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - last6Months.indexOf(m)));
          return ticketDate.getMonth() === date.getMonth() &&
                 ticketDate.getFullYear() === date.getFullYear();
        });

        if (monthIndex !== -1) {
          last6Months[monthIndex].revenue += Number(ticket.actual_cost);
        }
      }
    });

    return last6Months;
  }, [tickets]);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const maxRevenue = Math.max(...revenueData.map(item => item.revenue), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
          <p className="text-sm text-gray-500">Last 6 months performance</p>
        </div>
        <div className="bg-green-50 p-3 rounded-xl">
          <TrendingUp size={24} className="text-green-600" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <DollarSign size={20} className="text-gray-400" />
          <span className="text-3xl font-bold text-gray-900">
            R {totalRevenue.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Total revenue from completed tickets</p>
      </div>

      <div className="flex-1 flex items-end gap-2">
        {revenueData.map((item, index) => {
          const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '120px' }}>
                <div className="relative group w-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                    style={{ height: `${height}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      R {item.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
