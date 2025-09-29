import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft, Plus, Search, Filter, Download, Printer, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';
import { CustomerForm } from './CustomerForm';
import { TicketForm } from './TicketForm';
import { TicketsView } from './TicketsView';
import { TicketLabel } from './TicketLabel';

interface DashboardProps {
  onBack: () => void;
  onLogout: () => void;
  onTrackCustomer: () => void;
}

type DashboardView = 'tickets' | 'new-customer' | 'new-ticket' | 'label';

export const Dashboard: React.FC<DashboardProps> = ({ onBack, onLogout, onTrackCustomer }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('tickets');
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tickets with customer data
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('repair_tickets')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      setTickets(ticketsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = (customer: Customer) => {
    setCustomers(prev => [customer, ...prev]);
    setCurrentView('new-ticket');
  };

  const handleTicketCreated = (ticket: RepairTicket) => {
    setTickets(prev => [ticket, ...prev]);
    setSelectedTicket(ticket);
    setCurrentView('label');
  };

  const handleViewLabel = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setCurrentView('label');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.device_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const PRIMARY = '#5d5d5d';
  const SECONDARY = '#5d5d5d';

  return (
    <>
      {/* Load Montserrat from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen flex"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          backgroundColor: '#f8f9fa',
        }}
      >
        {/* Left Sidebar */}
        <div
          className="w-80 flex flex-col"
          style={{ backgroundColor: PRIMARY }}
        >
          {/* Logo and Brand */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src="/Untitled-CG2-01.png" 
                alt="Guardian Assist Logo" 
                className="w-12 h-12 rounded-xl bg-white/10 p-1"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Guardian Assist</h1>
                <p className="text-sm text-white/80">Computer Repair Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-6">
            <nav className="space-y-2">
              <button
                onClick={() => setCurrentView('tickets')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'tickets' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Search size={20} />
                <span>View Tickets</span>
              </button>
              <button
                onClick={() => setCurrentView('new-customer')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'new-customer' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Plus size={20} />
                <span>New Customer</span>
              </button>
              <button
                onClick={() => setCurrentView('new-ticket')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'new-ticket' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <Plus size={20} />
                <span>New Ticket</span>
              </button>
              <button
                onClick={onTrackCustomer}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors font-medium"
              >
                <Search size={20} />
                <span>Track Customer</span>
              </button>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            <p className="text-xs text-white/60 text-center mt-4">
              © 2025 Guardian Assist. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: SECONDARY }}>
                  {currentView === 'tickets' && 'Repair Tickets'}
                  {currentView === 'new-customer' && 'New Customer'}
                  {currentView === 'new-ticket' && 'New Repair Ticket'}
                  {currentView === 'label' && 'Ticket Label'}
                </h2>
                <p className="text-gray-600">
                  {currentView === 'tickets' && 'Manage and track repair tickets'}
                  {currentView === 'new-customer' && 'Add a new customer to the system'}
                  {currentView === 'new-ticket' && 'Create a new repair ticket'}
                  {currentView === 'label' && 'Print ticket label for device tracking'}
                </p>
              </div>
              
              {currentView === 'tickets' && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none w-64"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                    style={{ focusRingColor: PRIMARY }}
                  >
                    <option value="all">All Status</option>
                    <option value="received">Received</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting-parts">Waiting Parts</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: PRIMARY }}></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'tickets' && (
                  <TicketsView 
                    tickets={filteredTickets} 
                    onViewLabel={handleViewLabel}
                    onRefresh={loadData}
                  />
                )}
                {currentView === 'new-customer' && (
                  <CustomerForm onCustomerCreated={handleCustomerCreated} />
                )}
                {currentView === 'new-ticket' && (
                  <TicketForm 
                    customers={customers} 
                    onTicketCreated={handleTicketCreated}
                  />
                )}
                {currentView === 'label' && selectedTicket && (
                  <TicketLabel 
                    ticket={selectedTicket} 
                    onBack={() => setCurrentView('tickets')}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};