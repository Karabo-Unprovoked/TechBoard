import React, { useState } from 'react';
import { Search, ArrowLeft, User, Phone, Mail, Calendar, Laptop, FileText, Clock, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface CustomerTrackingProps {
  onBack: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export const CustomerTracking: React.FC<CustomerTrackingProps> = ({ onBack, onLogout, isAuthenticated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [error, setError] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setTrackingNumber('');
    setTickets([]);

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Database not configured. Please set up your backend connection.');
      setLoading(false);
      return;
    }

    try {
      // Search for tickets by ticket number
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('repair_tickets')
        .select('*')
        .ilike('ticket_number', `%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        if (ticketsError.code === 'PGRST116') {
          setError('No tickets found with that tracking number. Please check the number and try again.');
        } else {
          throw ticketsError;
        }
        setLoading(false);
        return;
      }

      if (!ticketsData || ticketsData.length === 0) {
        setError('No tickets found with that tracking number. Please check the number and try again.');
        setLoading(false);
        return;
      }
      
      setTrackingNumber(searchTerm.toUpperCase());
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
        return 'bg-blue-500 text-white';
      case 'in-progress':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'waiting-parts':
        return 'bg-orange-500 text-white';
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
      default:
        return 1;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
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
            
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ color: SECONDARY }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
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
                    {tickets[0].status === 'completed' ? 'Completed' : tickets[0].status.charAt(0).toUpperCase() + tickets[0].status.slice(1).replace('-', ' ')}
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
                  <div className="flex justify-between items-center mb-4">
                    {['RECEIVED', 'IN PROGRESS', 'TESTING', 'COMPLETED'].map((step, index) => {
                      const currentStep = getStatusStep(tickets[0].status);
                      const isActive = index + 1 <= currentStep;
                      const isCurrent = index + 1 === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                              isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isActive && <span className="text-white">✓</span>}
                          </div>
                          <span className={`text-xs font-medium ${isCurrent ? 'text-green-600' : 'text-gray-500'}`}>
                            {step}
                          </span>
                          {index < 3 && (
                            <div className={`h-1 w-full mt-2 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
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
                      <p className="text-sm text-gray-500">Device Type</p>
                      <p className="font-semibold" style={{ color: SECONDARY }}>{tickets[0].device_type}</p>
                    </div>
                  </div>

                  {(tickets[0].brand || tickets[0].model) && (
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-semibold" style={{ color: SECONDARY }}>
                        {[tickets[0].brand, tickets[0].model].filter(Boolean).join(' ')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar size={20} style={{ color: PRIMARY }} />
                    <div>
                      <p className="text-sm text-gray-500">Received Date</p>
                      <p className="font-semibold" style={{ color: SECONDARY }}>
                        {formatDate(tickets[0].created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                </h3>
                {tickets[0].issue_description && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2" style={{ color: SECONDARY }}>
                      Issue Description
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {tickets[0].issue_description}
                    </p>
                  </div>
                )}
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