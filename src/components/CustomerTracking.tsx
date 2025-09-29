import React, { useState } from 'react';
import { Search, ArrowLeft, User, Phone, Mail, Calendar, Laptop, FileText, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface CustomerTrackingProps {
  onBack: () => void;
}

export const CustomerTracking: React.FC<CustomerTrackingProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setCustomer(null);
    setTickets([]);

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Database not configured. Please set up your backend connection.');
      setLoading(false);
      return;
    }

    try {
      // Search for customer by name, email, or phone
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(1)
        .single();

      if (customerError) {
        if (customerError.code === 'PGRST116') {
          setError('No customer found with that information. Please check the details and try again.');
        } else {
          throw customerError;
        }
        setLoading(false);
        return;
      }

      setCustomer(customerData);

      // Fetch all tickets for this customer
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('repair_tickets')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
  const SECONDARY = '#5d5d5d';

  return (
    <>
      {/* Load Montserrat from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          background: `linear-gradient(135deg, rgba(255,180,0,0.06) 0%, rgba(93,93,93,0.03) 100%)`,
        }}
      >
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src="/Untitled-CG.png"
                  alt="Guardian Assist Logo"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-bold" style={{ color: SECONDARY }}>
                    Track Customer
                  </h1>
                  <p className="text-sm" style={{ color: SECONDARY }}>
                    Search for customer information and repair history
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="text-center mb-8">
                <div
                  className="p-4 rounded-xl inline-block mb-6"
                  style={{ background: 'rgba(255,180,0,0.12)' }}
                >
                  <Search size={48} style={{ color: PRIMARY }} />
                </div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: SECONDARY }}>
                  Enter tracking reference
                </h2>
                <p className="text-gray-600 mb-8">
                  Search by customer name, email address, or phone number
                </p>

                <form onSubmit={handleSearch} className="max-w-md mx-auto">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter customer details..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {loading ? 'Searching...' : 'Track'}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            {customer && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-xl font-semibold mb-6" style={{ color: SECONDARY }}>
                  Customer Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <User size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm text-gray-500">Customer Name</p>
                      <p className="font-semibold" style={{ color: SECONDARY }}>{customer.name}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail size={20} style={{ color: PRIMARY }} />
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold" style={{ color: SECONDARY }}>{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={20} style={{ color: PRIMARY }} />
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="font-semibold" style={{ color: SECONDARY }}>{customer.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm text-gray-500">Customer Since</p>
                      <p className="font-semibold" style={{ color: SECONDARY }}>
                        {formatDate(customer.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Repair Tickets */}
            {customer && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold" style={{ color: SECONDARY }}>
                    Repair History
                  </h3>
                  <span className="text-sm text-gray-500">
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No repair tickets found for this customer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold mb-2" style={{ color: SECONDARY }}>
                              {ticket.ticket_number}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock size={14} />
                              <span>{formatDate(ticket.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Laptop size={16} style={{ color: PRIMARY }} />
                            <div>
                              <p className="text-sm text-gray-500">Device</p>
                              <p className="font-medium" style={{ color: SECONDARY }}>
                                {ticket.device_type}
                              </p>
                            </div>
                          </div>

                          {(ticket.brand || ticket.model) && (
                            <div>
                              <p className="text-sm text-gray-500">Model</p>
                              <p className="font-medium" style={{ color: SECONDARY }}>
                                {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                              </p>
                            </div>
                          )}
                        </div>

                        {ticket.issue_description && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Issue Description</p>
                            <p className="text-gray-700">{ticket.issue_description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Support Information */}
            <div className="text-center mt-8 text-sm text-gray-600">
              <p>
                For any queries about your repair, contact us at{' '}
                <a href="mailto:support@guardianassist.co.za" className="font-medium" style={{ color: PRIMARY }}>
                  support@guardianassist.co.za
                </a>{' '}
                or{' '}
                <a href="tel:+27861203203" className="font-medium" style={{ color: PRIMARY }}>
                  +27 86 120 3203
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};