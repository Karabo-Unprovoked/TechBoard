import React from 'react';
import type { RepairTicket, TicketStatus } from '../../lib/supabase';
import { getStatusDisplayColors } from '../../lib/statusUtils';

interface StatusOverviewWidgetProps {
  tickets: RepairTicket[];
  statuses: TicketStatus[];
}

export const StatusOverviewWidget: React.FC<StatusOverviewWidgetProps> = ({ tickets, statuses }) => {
  const stats: any = {};

  statuses.forEach(status => {
    const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
    stats[statusKey] = tickets.filter(t => t.status === status.status_key).length;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <h3 className="text-base font-bold text-gray-900 mb-5">Status Overview</h3>
      <div className="space-y-4">
        {statuses.map((status) => {
          const colors = getStatusDisplayColors(status.status_key);
          const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
          const count = stats[statusKey] || 0;

          return (
            <div key={status.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center transition-colors`}>
                  <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">{status.status_label}</span>
              </div>
              <span className="font-bold text-gray-900">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
