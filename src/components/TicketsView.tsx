import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Eye, Calendar, User, Laptop, Tag, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface TicketsViewProps {
  onBack: () => void;
  onViewTicket: (ticket: RepairTicket & { customer: Customer }) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({ onBack, onViewTicket }) => {
  const [tickets, setTickets] = useState<(RepairTicket & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.device_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.brand && ticket.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.model && ticket.model.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
                <p className="text-gray-600">{filteredTickets.length} tickets found</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ticket number, customer name, or device..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="waiting-parts">Waiting Parts</option>
            </select>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No repair tickets have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.ticket_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('-', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={16} />
                          <div>
                            <p className="text-sm text-gray-500">Customer</p>
                            <p className="font-medium text-gray-900">{ticket.customer.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Laptop size={16} />
                          <div>
                            <p className="text-sm text-gray-500">Device</p>
                            <p className="font-medium text-gray-900">{ticket.device_type}</p>
                          </div>
                        </div>

                        {(ticket.brand || ticket.model) && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Tag size={16} />
                            <div>
                              <p className="text-sm text-gray-500">Model</p>
                              <p className="font-medium text-gray-900">
                                {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} />
                          <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium text-gray-900">{formatDate(ticket.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      {ticket.issue_description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Issue Description</p>
                          <p className="text-gray-700">{ticket.issue_description}</p>
                        </div>
                      )}

                      {ticket.customer.email && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {ticket.customer.email}
                          {ticket.customer.phone && (
                            <span className="ml-4">
                              <span className="font-medium">Phone:</span> {ticket.customer.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ml-4"
                    >
                      <Eye size={16} />
                      View Label
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};