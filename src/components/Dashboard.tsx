import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft, Plus, Search, Filter, Download, Printer, Eye, BarChart3, Users, Wrench, Clock, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';
import { CustomerForm } from './CustomerForm';
import { TicketForm } from './TicketForm';
import { TicketsView } from './TicketsView';
import { TicketLabel } from './TicketLabel';
import { TicketManagement } from './TicketManagement';
import { StatCard } from './StatCard';
import { SystemSettings } from './SystemSettings';
import { CustomersView } from './CustomersView';
import { CustomerManagement } from './CustomerManagement';

interface DashboardProps {
  onBack: () => void;
  onLogout: () => void;
  onTrackCustomer: () => void;
}

type DashboardView = 'dashboard' | 'tickets' | 'customers' | 'new-customer' | 'new-ticket' | 'label' | 'manage-ticket' | 'manage-customer' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ onBack, onLogout, onTrackCustomer }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - using empty data');
        setTickets([]);
        setCustomers([]);
        setLoading(false);
        return;
      }

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
      // Set empty data on error to prevent crashes
      setTickets([]);
      setCustomers([]);
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

  const handleManageTicket = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    setCurrentView('manage-ticket');
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentView('manage-customer');
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('repair_tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() }
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  // Calculate dashboard stats
  const stats = {
    totalTickets: tickets.length,
    pendingTickets: tickets.filter(t => t.status === 'received').length,
    inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
    completedTickets: tickets.filter(t => t.status === 'completed').length,
    waitingPartsTickets: tickets.filter(t => t.status === 'waiting-parts').length,
    unrepairableTickets: tickets.filter(t => t.status === 'unrepairable').length,
    pendingCustomerTickets: tickets.filter(t => t.status === 'pending-customer-action').length,
    totalCustomers: customers.length,
    todayTickets: tickets.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.created_at).toDateString() === today;
    }).length,
    weeklyRevenue: tickets.filter(t => t.status === 'completed').length * 150 // Mock calculation
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
                src="/FinalWhite.png" 
                alt="Guardian Assist Logo" 
                className="w-12 h-12"
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
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'dashboard' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('tickets')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'tickets' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Wrench size={20} />
                <span>All Tickets</span>
              </button>
              <button
                onClick={() => setCurrentView('customers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'customers' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={20} />
                <span>All Customers</span>
              </button>
              <button
                onClick={() => setCurrentView('new-customer')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'new-customer' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={20} />
                <span>New Customer</span>
              </button>
              <button
                onClick={() => setCurrentView('new-ticket')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'new-ticket' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Plus size={20} />
                <span>New Ticket</span>
              </button>
              <button
                onClick={onTrackCustomer}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors font-medium"
              >
                <Search size={20} />
                <span>Track Customer</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'settings' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
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
                  {currentView === 'dashboard' && 'Repair Operations Dashboard'}
                  {currentView === 'tickets' && 'Repair Tickets'}
                  {currentView === 'customers' && 'Customer Management'}
                  {currentView === 'new-customer' && 'New Customer'}
                  {currentView === 'new-ticket' && 'New Repair Ticket'}
                  {currentView === 'label' && 'Ticket Label'}
                  {currentView === 'manage-ticket' && 'Manage Ticket'}
                  {currentView === 'manage-customer' && 'Manage Customer'}
                  {currentView === 'settings' && 'System Settings'}
                </h2>
                <p className="text-gray-600">
                  {currentView === 'dashboard' && 'Monitor and manage all repair operations'}
                  {currentView === 'tickets' && 'Manage and track repair tickets'}
                  {currentView === 'customers' && 'View and manage customer information'}
                  {currentView === 'new-customer' && 'Add a new customer to the system'}
                  {currentView === 'new-ticket' && 'Create a new repair ticket'}
                  {currentView === 'label' && 'Print ticket label for device tracking'}
                  {currentView === 'manage-ticket' && 'Complete ticket management and communication'}
                  {currentView === 'manage-customer' && 'View customer details and repair history'}
                  {currentView === 'settings' && 'Configure system settings and test functionality'}
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
                    <option value="unrepairable">Unrepairable</option>
                    <option value="pending-customer-action">Pending Customer Action</option>
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
                    <option value="unrepairable">Unrepairable</option>
                    <option value="pending-customer-action">Pending Customer Action</option>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Supabase Configuration Warning */}
                    {!isSupabaseConfigured && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={20} className="text-yellow-600" />
                          <h4 className="font-medium text-yellow-900">Database Not Configured</h4>
                        </div>
                        <div className="text-sm text-yellow-800">
                          <p className="mb-2">Supabase connection is not configured. To enable full functionality:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Click the "Supabase" button in the settings (top of preview)</li>
                            <li>Follow the setup instructions to connect your database</li>
                            <li>Restart the application after configuration</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Total Tickets"
                        value={stats.totalTickets}
                        change={`+${stats.todayTickets} today`}
                        changeType="positive"
                        icon={Wrench}
                        color="blue"
                      />
                      <StatCard
                        title="In Progress"
                        value={stats.inProgressTickets}
                        change={`${Math.round((stats.inProgressTickets / stats.totalTickets) * 100)}% of total`}
                        changeType="neutral"
                        icon={Clock}
                        color="orange"
                      />
                      <StatCard
                        title="Completed"
                        value={stats.completedTickets}
                        change={`${Math.round((stats.completedTickets / stats.totalTickets) * 100)}% success rate`}
                        changeType="positive"
                        icon={CheckCircle}
                        color="green"
                      />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        {/* Recent Tickets with Status Updates */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                            <button
                              onClick={() => setCurrentView('tickets')}
                              className="text-sm font-medium hover:underline"
                              style={{ color: PRIMARY }}
                            >
                              View All
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {tickets.slice(0, 5).map((ticket) => (
                              <div key={ticket.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{ticket.ticket_number}</span>
                                    <span className="text-sm text-gray-600">
                                      {ticket.customer?.name} - {ticket.device_type}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleViewLabel(ticket)}
                                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                                    style={{ color: PRIMARY }}
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <select
                                    value={ticket.status}
                                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent outline-none"
                                    style={{ focusRingColor: PRIMARY }}
                                  >
                                    <option value="received">Received</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="waiting-parts">Waiting Parts</option>
                                    <option value="completed">Completed</option>
                                    <option value="unrepairable">Unrepairable</option>
                                    <option value="pending-customer-action">Pending Customer Action</option>
                                  </select>
                                  
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                      {new Date(ticket.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                          <div className="space-y-3">
                            <button
                              onClick={() => setCurrentView('new-ticket')}
                              className="w-full flex items-center gap-3 p-3 rounded-lg text-white font-medium transition-colors"
                              style={{ backgroundColor: PRIMARY }}
                            >
                              <Plus size={18} />
                              <span>New Ticket</span>
                            </button>
                            <button
                              onClick={() => setCurrentView('new-customer')}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                            >
                              <Users size={18} />
                              <span>Add Customer</span>
                            </button>
                            <button
                              onClick={onTrackCustomer}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                            >
                              <Search size={18} />
                              <span>Track Device</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Overview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Received</span>
                              </div>
                              <span className="font-medium">{stats.pendingTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">In Progress</span>
                              </div>
                              <span className="font-medium">{stats.inProgressTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Waiting Parts</span>
                              </div>
                              <span className="font-medium">{stats.waitingPartsTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Completed</span>
                              </div>
                              <span className="font-medium">{stats.completedTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Unrepairable</span>
                              </div>
                              <span className="font-medium">{stats.unrepairableTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Pending Customer</span>
                              </div>
                              <span className="font-medium">{stats.pendingCustomerTickets}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    </div>
                )}
                {currentView === 'tickets' && (
                  <TicketsView 
                    tickets={filteredTickets} 
                    onViewLabel={handleViewLabel}
                    onManageTicket={handleManageTicket}
                    onRefresh={loadData}
                    onUpdateStatus={updateTicketStatus}
                  />
                )}
                {currentView === 'customers' && (
                  <CustomersView 
                    customers={customers} 
                    onViewCustomer={handleViewCustomer}
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
                {currentView === 'manage-ticket' && selectedTicket && (
                  <TicketManagement 
                    ticket={selectedTicket} 
                    onBack={() => setCurrentView('tickets')}
                    onTicketUpdated={(updatedTicket) => {
                      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
                      setSelectedTicket(updatedTicket);
                    }}
                  />
                )}
                {currentView === 'manage-customer' && selectedCustomer && (
                  <CustomerManagement 
                    customer={selectedCustomer} 
                    onBack={() => setCurrentView('customers')}
                    onCustomerUpdated={(updatedCustomer) => {
                      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
                      setSelectedCustomer(updatedCustomer);
                    }}
                  />
                )}
                {currentView === 'settings' && (
                  <SystemSettings onBack={() => setCurrentView('dashboard')} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};