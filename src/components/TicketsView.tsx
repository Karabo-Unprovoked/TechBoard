import React, { useState, useEffect } from 'react';
import { Eye, RefreshCw, Calendar, User, Laptop, FileText, Settings, LayoutGrid, List } from 'lucide-react';
import type { RepairTicket, TicketStatus } from '../lib/supabase';
import { loadStatuses, getStatusColor as getStatusColorUtil, getStatusLabel } from '../lib/statusUtils';

interface TicketsViewProps {
  tickets: RepairTicket[];
  onViewLabel: (ticket: RepairTicket) => void;
  onManageTicket?: (ticket: RepairTicket) => void;
  onRefresh: () => void;
  onUpdateStatus?: (ticketId: string, newStatus: string) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  onViewLabel,
  onManageTicket,
  onRefresh,
  onUpdateStatus
}) => {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const data = await loadStatuses();
      setStatuses(data);
    };
    fetchStatuses();
  }, []);

  const getStatusColor = getStatusColorUtil;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const PRIMARY = '#ffb400';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-6">
      {/* Header with refresh button and view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-600">Manage repair tickets and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-gray-900' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="List View"
            >
              <List size={16} className={viewMode === 'list' ? 'text-gray-900' : 'text-gray-600'} />
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600">Create a new ticket to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              {/* Ticket Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{ticket.ticket_number}</h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(statuses, ticket.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onManageTicket && (
                    <button
                      onClick={() => onManageTicket(ticket)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: PRIMARY }}
                      title="Manage Ticket"
                    >
                      <Settings size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => onViewLabel(ticket)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: PRIMARY }}
                    title="View Label"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              {ticket.customer && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <User size={16} />
                  <span>{ticket.customer.first_name} {ticket.customer.last_name}</span>
                </div>
              )}

              {/* Device Info */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <Laptop size={16} />
                <span>
                  {ticket.device_type}
                  {(ticket.brand || ticket.model) && (
                    <span className="text-gray-500">
                      {' '}• {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                    </span>
                  )}
                </span>
              </div>

              {/* Issue Description */}
              {ticket.issue_description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {ticket.issue_description}
                  </p>
                </div>
              )}

              {/* Status Update */}
              {onUpdateStatus && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Update Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent outline-none"
                    style={{ focusRingColor: PRIMARY }}
                  >
                    <option value="received">Received</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting-parts">Waiting Parts</option>
                    <option value="completed">Completed</option>
                    <option value="unrepairable">Unrepairable</option>
                    <option value="pending-customer-action">Pending Customer Action</option>
                  </select>
                </div>
              )}

              {/* Repair Notes for unrepairable items */}
              {ticket.status === 'unrepairable' && ticket.repair_notes && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-red-600 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-200">
                    {ticket.repair_notes}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={14} />
                <span>Created {formatDate(ticket.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{ticket.ticket_number}</div>
                    {ticket.issue_description && (
                      <div className="text-sm text-gray-600 line-clamp-1 mt-1">{ticket.issue_description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.customer && (
                      <div className="text-sm text-gray-900">
                        {ticket.customer.first_name} {ticket.customer.last_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ticket.device_type}</div>
                    {(ticket.brand || ticket.model) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {onUpdateStatus ? (
                      <select
                        value={ticket.status}
                        onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                      >
                        <option value="received">Received</option>
                        <option value="in-progress">In Progress</option>
                        <option value="waiting-parts">Waiting Parts</option>
                        <option value="completed">Completed</option>
                        <option value="unrepairable">Unrepairable</option>
                        <option value="pending-customer-action">Pending Customer Action</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(statuses, ticket.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatDate(ticket.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {onManageTicket && (
                        <button
                          onClick={() => onManageTicket(ticket)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: PRIMARY }}
                          title="Manage Ticket"
                        >
                          <Settings size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => onViewLabel(ticket)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: PRIMARY }}
                        title="View Label"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};