import React from 'react';
import { QrCode, Eye } from 'lucide-react';
import type { RepairTicket, TicketStatus } from '../../lib/supabase';

interface RecentTicketsWidgetProps {
  tickets: RepairTicket[];
  statuses: TicketStatus[];
  onViewLabel: (ticket: RepairTicket) => void;
  onManageTicket: (ticket: RepairTicket) => void;
  onUpdateStatus: (ticketId: string, newStatus: string, internalStatus?: string) => void;
  onNavigate: (view: string) => void;
}

export const RecentTicketsWidget: React.FC<RecentTicketsWidgetProps> = ({
  tickets,
  statuses,
  onViewLabel,
  onManageTicket,
  onUpdateStatus,
  onNavigate,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Latest Updates</h3>
        <button
          onClick={() => onNavigate('tickets')}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All →
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {tickets.slice(0, 5).map((ticket) => (
          <div key={ticket.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 px-3 py-1 rounded-lg">
                  <span className="font-semibold text-gray-900 text-sm">{ticket.ticket_number}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {ticket.customer?.name} - {ticket.device_type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewLabel(ticket)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: '#ffb400' }}
                  title="View QR Label"
                >
                  <QrCode size={16} />
                </button>
                <button
                  onClick={() => onManageTicket(ticket)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  title="View Ticket"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={ticket.status}
                  onChange={(e) => {
                    onUpdateStatus(ticket.id, e.target.value, '');
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.status_key}>
                      {status.status_label}
                    </option>
                  ))}
                </select>

                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {(() => {
                const currentStatus = statuses.find(s => s.status_key === ticket.status);
                if (currentStatus?.sub_statuses && currentStatus.sub_statuses.length > 0) {
                  return (
                    <select
                      value={ticket.internal_status || ''}
                      onChange={(e) => onUpdateStatus(ticket.id, ticket.status, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">—</option>
                      {currentStatus.sub_statuses.map((subStatus) => (
                        <option key={subStatus.id} value={subStatus.sub_status_key}>
                          {subStatus.sub_status_label}
                        </option>
                      ))}
                    </select>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
