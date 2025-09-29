import React from 'react';
import { Eye, RefreshCw, Calendar, User, Laptop, FileText } from 'lucide-react';
import type { RepairTicket } from '../lib/supabase';

interface TicketsViewProps {
  tickets: RepairTicket[];
  onViewLabel: (ticket: RepairTicket) => void;
  onRefresh: () => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({ tickets, onViewLabel, onRefresh }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'waiting-parts':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-600">Manage repair tickets and track progress</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              {/* Ticket Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{ticket.ticket_number}</h4>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => onViewLabel(ticket)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ color: PRIMARY }}
                  title="View Label"
                >
                  <Eye size={18} />
                </button>
              </div>

              {/* Customer Info */}
              {ticket.customer && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <User size={16} />
                  <span>{ticket.customer.name}</span>
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

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={14} />
                <span>Created {formatDate(ticket.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};