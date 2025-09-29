import React from 'react';
import { Search, LogOut, Monitor, Clock, User, Laptop, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface DashboardProps {
  onTrackCustomer: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTrackCustomer, onLogout }) => {
  const [recentTickets, setRecentTickets] = React.useState<(RepairTicket & { customer: Customer })[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchRecentTickets();
  }, []);

  const fetchRecentTickets = async () => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, skipping ticket fetch');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('repair_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTickets(data || []);
    } catch (error) {
      console.error('Error fetching recent tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
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
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          background: `linear-gradient(135deg, rgba(255,180,0,0.06) 0%, rgba(93,93,93,0.03) 100%)`,
        }}
      >
        <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Untitled-CG.png"
                alt="Guardian Assist Logo"
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold" style={{ color: SECONDARY }}>
                  Guardian Assist
                </h1>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Computer Repair Management
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{
                color: SECONDARY,
                background: 'transparent',
              }}
            >
              <LogOut size={16} style={{ color: SECONDARY }} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Create New Ticket Section */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <div
                    className="p-4 rounded-xl inline-block mb-6"
                    style={{ background: 'rgba(255,180,0,0.12)' }}
                  >
                    <Search size={48} style={{ color: PRIMARY }} />
                  </div>

                  <h2 className="text-2xl font-bold mb-4" style={{ color: SECONDARY }}>
                    Ready to Track a Customer?
                  </h2>

                  <p className="mb-8" style={{ color: SECONDARY }}>
                    Search for customer information and view their complete repair history.
                    Track all tickets linked to a customer.
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={onTrackCustomer}
                      className="w-full px-8 py-4 rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: PRIMARY,
                        color: '#1f1f1f',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      }}
                    >
                      Track Customer
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Tickets Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock size={20} style={{ color: PRIMARY }} />
                  <h3 className="text-xl font-semibold" style={{ color: SECONDARY }}>
                    Recent Tickets
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: PRIMARY }}></div>
                    <p className="text-sm" style={{ color: SECONDARY }}>Loading...</p>
                  </div>
                ) : recentTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm" style={{ color: SECONDARY }}>No tickets yet</p>
                    <p className="text-xs text-gray-500">Create your first ticket to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-sm" style={{ color: SECONDARY }}>
                            {ticket.ticket_number}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="truncate">{ticket.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Laptop size={14} />
                            <span>{ticket.device_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{formatDate(ticket.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={onTrackCustomer}
                  className="w-full mt-6 py-3 px-4 rounded-lg transition-all duration-200 font-medium hover:opacity-90"
                  style={{
                    backgroundColor: SECONDARY,
                    color: '#ffffff',
                  }}
                >
                  Track Customer
                </button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <Search size={24} style={{ color: '#22c55e' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  Customer Tracking
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Search and track customer repair history and ticket status
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(139,92,246,0.08)' }}>
                  <User size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  Customer Information
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  View detailed customer information and contact details
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="p-3 rounded-lg inline-block mb-4" style={{ background: 'rgba(255,165,0,0.08)' }}>
                  <Monitor size={24} style={{ color: 'rgb(255,165,0)' }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: SECONDARY }}>
                  Repair History
                </h3>
                <p className="text-sm" style={{ color: SECONDARY }}>
                  Complete repair history with status updates and device information
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};