import React, { useState, useEffect } from 'react';
import { QrCode, Eye, RefreshCw, Calendar, User, Laptop, FileText, Settings, LayoutGrid, List, Download } from 'lucide-react';
import type { RepairTicket, TicketStatus } from '../lib/supabase';
import { loadStatuses, getStatusColor as getStatusColorUtil, getStatusLabel, getSubStatusLabel } from '../lib/statusUtils';
import { exportTicketsToExcel } from '../lib/exportUtils';

interface TicketsViewProps {
  tickets: RepairTicket[];
  onViewLabel: (ticket: RepairTicket) => void;
  onManageTicket?: (ticket: RepairTicket) => void;
  onRefresh: () => void;
  onUpdateStatus?: (ticketId: string, newStatus: string) => void;
  onUpdateSubStatus?: (ticketId: string, newSubStatus: string | null) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  onViewLabel,
  onManageTicket,
  onRefresh,
  onUpdateStatus,
  onUpdateSubStatus
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

  const getStatusDisplayColors = (statusKey: string) => {
    switch (statusKey) {
      case 'pending':
        return { bg: 'bg-purple-50', dot: 'bg-purple-500', text: 'text-purple-700', ring: 'ring-purple-200' };
      case 'received':
        return { bg: 'bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-200' };
      case 'in-progress':
        return { bg: 'bg-yellow-50', dot: 'bg-yellow-500', text: 'text-yellow-700', ring: 'ring-yellow-200' };
      case 'invoiced':
        return { bg: 'bg-indigo-50', dot: 'bg-indigo-500', text: 'text-indigo-700', ring: 'ring-indigo-200' };
      case 'completed':
        return { bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-700', ring: 'ring-green-200' };
      case 'unrepairable':
        return { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-200' };
      case 'pending-customer-action':
        return { bg: 'bg-orange-50', dot: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-200' };
      case 'void':
        return { bg: 'bg-gray-50', dot: 'bg-gray-500', text: 'text-gray-700', ring: 'ring-gray-200' };
      default:
        return { bg: 'bg-gray-50', dot: 'bg-gray-500', text: 'text-gray-700', ring: 'ring-gray-200' };
    }
  };

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header with refresh button and view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">Manage repair tickets and track progress</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} className="sm:w-4 sm:h-4" style={{ color: viewMode === 'grid' ? '#5d5d5d' : '#6b7280' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="List View"
            >
              <List size={14} className="sm:w-4 sm:h-4" style={{ color: viewMode === 'list' ? '#5d5d5d' : '#6b7280' }} />
            </button>
          </div>

          <button
            onClick={() => exportTicketsToExcel(tickets)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Export to Excel"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Refresh</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onManageTicket && onManageTicket(ticket)}
            >
              {/* Ticket Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{ticket.ticket_number}</h4>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                    <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(statuses, ticket.status)}
                    </span>
                    {ticket.internal_status && (
                      <span className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700">
                        {getSubStatusLabel(statuses, ticket.status, ticket.internal_status)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewLabel(ticket);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: PRIMARY }}
                    title="View QR Label"
                  >
                    <QrCode size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageTicket && onManageTicket(ticket);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    title="View Ticket"
                  >
                    <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              {ticket.customer && (
                <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
                  <User size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{ticket.customer.first_name} {ticket.customer.last_name}</span>
                </div>
              )}

              {/* Device Info */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
                <Laptop size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
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
                <div className="mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                    {ticket.issue_description}
                  </p>
                </div>
              )}

              {/* Status Update */}
              {onUpdateStatus && (
                <div className="mb-3 sm:mb-4" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-500 mb-2">
                    Update Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((status) => {
                      const colors = getStatusDisplayColors(status.status_key);
                      const isActive = ticket.status === status.status_key;
                      return (
                        <button
                          key={status.id}
                          onClick={() => onUpdateStatus(ticket.id, status.status_key)}
                          className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                            isActive
                              ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status.status_label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-status options */}
                  {onUpdateSubStatus && ticket.status && statuses.find(s => s.status_key === ticket.status)?.sub_statuses && statuses.find(s => s.status_key === ticket.status)!.sub_statuses!.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-500 mb-2">
                        Sub-status (Optional)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => onUpdateSubStatus(ticket.id, null)}
                          className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                            !ticket.internal_status
                              ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          None
                        </button>
                        {statuses.find(s => s.status_key === ticket.status)?.sub_statuses?.map((subStatus) => {
                          const isActive = ticket.internal_status === subStatus.sub_status_key;
                          return (
                            <button
                              key={subStatus.sub_status_key}
                              onClick={() => onUpdateSubStatus(ticket.id, subStatus.sub_status_key)}
                              className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {subStatus.sub_status_label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onManageTicket && onManageTicket(ticket)}
                >
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
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {onUpdateStatus ? (
                      <div className="min-w-[200px]">
                        <div className="flex flex-wrap gap-1.5">
                          {statuses.map((status) => {
                            const colors = getStatusDisplayColors(status.status_key);
                            const isActive = ticket.status === status.status_key;
                            return (
                              <button
                                key={status.id}
                                onClick={() => onUpdateStatus(ticket.id, status.status_key)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                  isActive
                                    ? `${colors.bg} ${colors.text} ring-2 ${colors.ring}`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {status.status_label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Sub-status options */}
                        {onUpdateSubStatus && ticket.status && statuses.find(s => s.status_key === ticket.status)?.sub_statuses && statuses.find(s => s.status_key === ticket.status)!.sub_statuses!.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => onUpdateSubStatus(ticket.id, null)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                  !ticket.internal_status
                                    ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                None
                              </button>
                              {statuses.find(s => s.status_key === ticket.status)?.sub_statuses?.map((subStatus) => {
                                const isActive = ticket.internal_status === subStatus.sub_status_key;
                                return (
                                  <button
                                    key={subStatus.sub_status_key}
                                    onClick={() => onUpdateSubStatus(ticket.id, subStatus.sub_status_key)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                      isActive
                                        ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {subStatus.sub_status_label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(statuses, ticket.status)}
                        </span>
                        {ticket.internal_status && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {getSubStatusLabel(statuses, ticket.status, ticket.internal_status)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatDate(ticket.created_at)}</div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewLabel(ticket)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: PRIMARY }}
                        title="View QR Label"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={() => onManageTicket && onManageTicket(ticket)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                        title="View Ticket"
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