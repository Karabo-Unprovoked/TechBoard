import React, { useState, useCallback } from 'react';
import { Search, ArrowLeft, User, Phone, Mail, Calendar, Laptop, FileText, Clock, LogOut, RefreshCw, Hash, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket, TicketNote } from '../lib/supabase';

interface CustomerTrackingProps {
  onBack: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  onDashboard?: () => void;
}

export const CustomerTracking: React.FC<CustomerTrackingProps> = ({ onBack, onLogout, isAuthenticated, onDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [error, setError] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState<TicketNote[]>([]);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');
    setTrackingNumber('');
    setTickets([]);

    try {
      // Search for tickets by ticket number
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('repair_tickets')
        .select(`
          *,
          customer:customers(customer_number, name)
        `)
        .ilike('ticket_number', `%${term}%`)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Database error:', ticketsError);
        setError('Unable to connect to tracking system. Please try again later.');
        setLoading(false);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setError('No tickets found with that tracking number. Please check the number and try again.');
        setLoading(false);
        return;
      }

      setTrackingNumber(term.toUpperCase());
      setTickets(ticketsData || []);

      // Load customer-visible notes for the first ticket
      if (ticketsData && ticketsData.length > 0) {
        const { data: notesData } = await supabase
          .from('ticket_notes')
          .select('*')
          .eq('ticket_id', ticketsData[0].id)
          .eq('note_type', 'customer')
          .order('created_at', { ascending: false });

        setCustomerNotes(notesData || []);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const hash = window.location.hash;
    console.log('Hash detected:', hash);
    if (hash && hash.startsWith('#track-')) {
      const ticketNumber = hash.replace('#track-', '');
      console.log('Searching for ticket:', ticketNumber);
      if (ticketNumber) {
        setSearchTerm(ticketNumber);
        performSearch(ticketNumber);
      }
    }
  }, [performSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchTerm);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-500 text-white';
      case 'in-progress':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'waiting-parts':
        return 'bg-orange-500 text-white';
      case 'unrepairable':
        return 'bg-red-500 text-white';
      case 'pending-customer-action':
        return 'bg-purple-500 text-white';
      case 'void':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'received':
        return 1;
      case 'in-progress':
        return 2;
      case 'waiting-parts':
        return 3;
      case 'completed':
        return 4;
      case 'unrepairable':
        return 4; // Final status
      case 'pending-customer-action':
        return 2; // Customer needs to take action
      case 'void':
        return 4; // Final status
      default:
        return 1;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
                  src="/FinalWhite.png" 
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
            
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {onDashboard && (
                  <button
                    onClick={onDashboard}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
                    style={{ color: SECONDARY }}
                  >
                    <User size={16} />
                    <span>Dashboard</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: SECONDARY }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
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
                  Track Your Device
                </h2>
                <p className="text-gray-600 mb-8">
                  Enter your ticket number to track your device repair status
                </p>

                <form onSubmit={handleSearch} className="max-w-md mx-auto">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter ticket number (e.g., TK-20250115-001)"
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

            {/* Tracking Results */}
            {trackingNumber && tickets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: SECONDARY }}>
                    Repair Status: {tickets[0].status === 'completed' ? 'Completed' : tickets[0].status.charAt(0).toUpperCase() + tickets[0].status.slice(1).replace('-', ' ')}
                  </h3>
                  <p className="text-xl font-semibold" style={{ color: PRIMARY }}>
                    {trackingNumber}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: SECONDARY, color: 'white' }}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>

                {/* Status Progress */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-4 text-center" style={{ color: SECONDARY }}>
                    Repair Progress
                  </h4>
                  <div className="flex justify-between items-center mb-4">
                    {['RECEIVED', 'IN PROGRESS', 'TESTING', 'COMPLETED'].map((step, index) => {
                      const currentStep = getStatusStep(tickets[0].status);
                      const isActive = index + 1 <= currentStep;
                      const isCurrent = index + 1 === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-bold ${
                              isActive ? 'text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                            style={{ backgroundColor: isActive ? PRIMARY : undefined }}
                          >
                            {isActive ? '✓' : index + 1}
                          </div>
                          <span className={`text-sm font-medium text-center ${isCurrent ? 'font-bold' : 'text-gray-500'}`} style={{ color: isCurrent ? PRIMARY : undefined }}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: PRIMARY,
                        width: `${(getStatusStep(tickets[0].status) / 4) * 100}%`
                      }}
                    />
                  </div>
                  
                  {/* Status Description */}
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,180,0,0.1)' }}>
                    <p className="text-sm" style={{ color: SECONDARY }}>
                      {tickets[0].status === 'received' && 'Your device has been received and is in our queue for diagnosis.'}
                      {tickets[0].status === 'in-progress' && 'Our technicians are currently working on diagnosing and repairing your device.'}
                      {tickets[0].status === 'waiting-parts' && 'We are waiting for replacement parts to arrive. We will continue once parts are available.'}
                      {tickets[0].status === 'completed' && 'Your device repair is complete and ready for collection!'}
                      {tickets[0].status === 'unrepairable' && 'Unfortunately, your device cannot be repaired. Please contact us for more details.'}
                      {tickets[0].status === 'pending-customer-action' && 'We need additional information or approval from you to proceed with the repair.'}
                    </p>
                  </div>
                </div>

                {/* Device Information */}
                <h4 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  Device Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Laptop size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm font-bold text-gray-700">Device Type</p>
                      <p className="text-gray-900">{tickets[0].device_type}</p>
                    </div>
                  </div>

                  {(tickets[0].brand || tickets[0].model) && (
                    <div className="flex items-center gap-3">
                      <Laptop size={20} style={{ color: PRIMARY }} />
                      <div>
                        <p className="text-sm font-bold text-gray-700">Model</p>
                        <p className="text-gray-900">
                        {[tickets[0].brand, tickets[0].model].filter(Boolean).join(' ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {tickets[0].serial_number && (
                    <div className="flex items-center gap-3">
                      <Hash size={20} style={{ color: PRIMARY }} />
                      <div>
                        <p className="text-sm font-bold text-gray-700">Serial Number</p>
                        <p className="font-mono text-sm text-gray-900">
                        {tickets[0].serial_number}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm font-bold text-gray-700">Received Date</p>
                      <p className="text-gray-900">
                        {formatDate(tickets[0].created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm font-bold text-gray-700">Last Updated</p>
                      <p className="text-gray-900">
                        {formatDate(tickets[0].updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${getStatusColor(tickets[0].status)}`}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-700">Current Status</p>
                      <p className="capitalize text-gray-900">
                        {tickets[0].status.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {tickets[0].issue_description && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2" style={{ color: SECONDARY }}>
                      Reported Issue
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4" style={{ borderColor: PRIMARY }}>
                      <p className="text-gray-700">
                        {tickets[0].issue_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Technician Notes */}
                {customerNotes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                      <MessageSquare className="inline mr-2" size={20} />
                      Updates from Technician
                    </h4>
                    <div className="space-y-3">
                      {customerNotes.map((note) => (
                        <div key={note.id} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-600">TECHNICIAN NOTE</span>
                            <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                          </div>
                          <p className="text-gray-800">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Estimated Timeline */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold mb-2 text-blue-900">
                    What to Expect
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• Most repairs are completed within 3-5 business days</p>
                    <p>• You will be contacted if additional parts are needed</p>
                    <p>• We will notify you when your device is ready for collection</p>
                    <p>• All repairs come with a 30-day warranty</p>
                  </div>
                </div>
              </div>
            )}

            {/* Support Information */}
            <div className="text-center mt-8 text-sm text-gray-600">
              <p>
                For any queries about your device repair, contact us at{' '}
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