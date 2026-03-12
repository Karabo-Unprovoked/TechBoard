import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, Wrench, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import type { RepairTicket, Customer } from '../lib/supabase';
import { getStatusLabel } from '../lib/statusUtils';

interface AnalyticsDashboardProps {
  tickets: RepairTicket[];
  customers: Customer[];
  statuses: any[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export function AnalyticsDashboard({ tickets, customers, statuses }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const getTimeRangeDate = (range: TimeRange): Date => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
  };

  const filterByTimeRange = (date: string) => {
    const itemDate = new Date(date);
    const rangeDate = getTimeRangeDate(timeRange);
    return itemDate >= rangeDate;
  };

  const getStatusColor = (statusKey: string): string => {
    const colors: Record<string, string> = {
      'pending': '#f59e0b',
      'received': '#3b82f6',
      'in-progress': '#8b5cf6',
      'invoiced': '#f97316',
      'completed': '#10b981',
      'unrepairable': '#ef4444',
      'pending-customer-action': '#eab308',
      'void': '#6b7280'
    };
    return colors[statusKey] || '#6b7280';
  };

  const calculateDailyTrend = (rangeTickets: RepairTicket[]) => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const trend: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = rangeTickets.filter(t => {
        const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
        return ticketDate === dateStr;
      }).length;

      trend.push({ date: dateStr, count });
    }

    return trend;
  };

  const formatTime = (hours: number): string => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const analytics = useMemo(() => {
    const rangeTickets = tickets.filter(t => t.created_at && filterByTimeRange(t.created_at));
    const completedTickets = rangeTickets.filter(t => t.status === 'completed');
    const activeTickets = tickets.filter(t =>
      t.status !== 'completed' && t.status !== 'void'
    );

    const calculateAverageResolutionTime = () => {
      const completed = completedTickets.filter(t => t.updated_at);
      if (completed.length === 0) return 0;

      const totalHours = completed.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        const hours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      return totalHours / completed.length;
    };

    const avgResolutionTime = calculateAverageResolutionTime();

    const calculateRevenue = () => {
      return completedTickets.length * 150;
    };

    const newCustomersInRange = customers.filter(c => c.created_at && filterByTimeRange(c.created_at)).length;

    const statusBreakdown = statuses.map(status => ({
      status: status.status_label,
      count: rangeTickets.filter(t => t.status === status.status_key).length,
      color: getStatusColor(status.status_key)
    }));

    const deviceTypeBreakdown = rangeTickets.reduce((acc, ticket) => {
      const device = ticket.device_type || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDevices = Object.entries(deviceTypeBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const dailyTicketTrend = calculateDailyTrend(rangeTickets);

    const completionRate = rangeTickets.length > 0
      ? (completedTickets.length / rangeTickets.length) * 100
      : 0;

    const previousRangeTickets = tickets.filter(t => {
      if (!t.created_at) return false;
      const itemDate = new Date(t.created_at);
      const currentRangeDate = getTimeRangeDate(timeRange);
      const previousRangeDate = new Date(currentRangeDate.getTime() - (new Date().getTime() - currentRangeDate.getTime()));
      return itemDate >= previousRangeDate && itemDate < currentRangeDate;
    });

    let ticketGrowth = 0;
    if (previousRangeTickets.length > 0) {
      ticketGrowth = ((rangeTickets.length - previousRangeTickets.length) / previousRangeTickets.length) * 100;
    } else if (rangeTickets.length > 0) {
      ticketGrowth = 100;
    }

    return {
      totalTickets: rangeTickets.length,
      completedTickets: completedTickets.length,
      activeTickets: activeTickets.length,
      avgResolutionTime,
      revenue: calculateRevenue(),
      newCustomers: newCustomersInRange,
      statusBreakdown,
      topDevices,
      dailyTicketTrend,
      completionRate,
      ticketGrowth: isFinite(ticketGrowth) ? ticketGrowth : 0
    };
  }, [tickets, customers, statuses, timeRange]);

  const maxTrendValue = analytics.dailyTicketTrend.length > 0
    ? Math.max(...analytics.dailyTicketTrend.map(d => d.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          <p className="text-sm text-gray-500 mt-1">Track performance and business metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 3 Months</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Wrench size={24} className="text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${analytics.ticketGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics.ticketGrowth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(analytics.ticketGrowth).toFixed(1)}%
            </div>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Total Tickets</h4>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalTickets}</p>
          <p className="text-xs text-gray-500 mt-2">{analytics.activeTickets} currently active</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <Activity size={24} className="text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {analytics.completionRate.toFixed(1)}%
            </span>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Completed</h4>
          <p className="text-3xl font-bold text-gray-900">{analytics.completedTickets}</p>
          <p className="text-xs text-gray-500 mt-2">Completion rate</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Avg Resolution Time</h4>
          <p className="text-3xl font-bold text-gray-900">{formatTime(analytics.avgResolutionTime)}</p>
          <p className="text-xs text-gray-500 mt-2">Time to complete</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 p-3 rounded-xl">
              <DollarSign size={24} className="text-amber-600" />
            </div>
          </div>
          <h4 className="text-gray-600 text-sm font-medium mb-1">Revenue</h4>
          <p className="text-3xl font-bold text-gray-900">${analytics.revenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">From completed tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Ticket Trend</h3>
            <BarChart3 size={20} className="text-gray-400" />
          </div>

          <div className="space-y-2">
            {analytics.dailyTicketTrend.map((day, index) => {
              const percentage = (day.count / maxTrendValue) * 100;
              const showLabel = timeRange === 'week' || index % Math.ceil(analytics.dailyTicketTrend.length / 10) === 0;

              return (
                <div key={day.date} className="flex items-center gap-3">
                  {showLabel ? (
                    <span className="text-xs text-gray-500 w-20 text-right">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="w-20"></span>
                  )}
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      {day.count > 0 && (
                        <span className="text-xs font-semibold text-white">{day.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-900">Status Distribution</h3>
              <PieChart size={18} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {analytics.statusBreakdown.filter(s => s.count > 0).map((status) => {
                const percentage = analytics.totalTickets > 0
                  ? (status.count / analytics.totalTickets) * 100
                  : 0;

                return (
                  <div key={status.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{status.status}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">New Customers</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600 mb-2">{analytics.newCustomers}</p>
            <p className="text-sm text-gray-500">Added in this period</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Device Types</h3>
        {analytics.topDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.topDevices.map(([device, count], index) => {
              const percentage = analytics.totalTickets > 0
                ? (count / analytics.totalTickets) * 100
                : 0;

              return (
                <div key={device} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1 capitalize">
                    {device.replace('-laptop', '').replace('-', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{count}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No device data available for this period</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-lg font-bold">Performance Score</h3>
          </div>
          <p className="text-5xl font-bold mb-2">{analytics.completionRate.toFixed(0)}%</p>
          <p className="text-blue-100 text-sm">Based on completion rate and resolution time</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold">Growth Rate</h3>
          </div>
          <p className="text-5xl font-bold mb-2">
            {analytics.ticketGrowth >= 0 ? '+' : ''}{analytics.ticketGrowth.toFixed(1)}%
          </p>
          <p className="text-green-100 text-sm">Compared to previous period</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold">Active Workload</h3>
          </div>
          <p className="text-5xl font-bold mb-2">{analytics.activeTickets}</p>
          <p className="text-purple-100 text-sm">Tickets currently in progress</p>
        </div>
      </div>
    </div>
  );
}
