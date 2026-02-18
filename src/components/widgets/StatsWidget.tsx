import React from 'react';
import { Wrench, FileText, Users } from 'lucide-react';
import type { RepairTicket, TicketStatus } from '../../lib/supabase';
import { getStatusDisplayColors } from '../../lib/statusUtils';

interface StatsWidgetProps {
  tickets: RepairTicket[];
  customers: any[];
  pendingRequests: number;
  statuses: TicketStatus[];
  onNavigate: (view: string) => void;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  tickets,
  customers,
  pendingRequests,
  statuses,
  onNavigate,
}) => {
  const stats: any = {
    totalTickets: tickets.length,
    todayTickets: tickets.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.created_at).toDateString() === today;
    }).length,
  };

  statuses.forEach(status => {
    const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
    stats[statusKey] = tickets.filter(t => t.status === status.status_key).length;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-blue-50 p-3 rounded-xl">
            <Wrench size={24} className="text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            +{stats.todayTickets} today
          </span>
        </div>
        <h4 className="text-gray-600 text-sm font-medium mb-1">Total Tickets</h4>
        <p className="text-3xl font-bold text-gray-900 mb-3">{stats.totalTickets}</p>

        <div className="space-y-2 pt-3 border-t border-gray-100">
          {statuses.slice(0, 3).map((status) => {
            const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
            const count = stats[statusKey] || 0;
            const percentage = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0;
            const colors = getStatusDisplayColors(status.status_key);

            return (
              <div key={status.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                  <span className="text-xs text-gray-600">{status.status_label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onNavigate('registration-requests')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-orange-50 p-3 rounded-xl">
            <FileText size={24} className="text-orange-600" />
          </div>
          {pendingRequests > 0 && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Needs Review
            </span>
          )}
        </div>
        <h4 className="text-gray-600 text-sm font-medium mb-1">Pending Registrations</h4>
        <p className="text-3xl font-bold text-gray-900">{pendingRequests}</p>
        <p className="text-xs text-gray-500 mt-2">Click to review requests</p>
      </div>

      <div
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onNavigate('customers')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="bg-green-50 p-3 rounded-xl">
            <Users size={24} className="text-green-600" />
          </div>
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Active
          </span>
        </div>
        <h4 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h4>
        <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
        <p className="text-xs text-gray-500 mt-2">Click to view all customers</p>
      </div>
    </div>
  );
};
