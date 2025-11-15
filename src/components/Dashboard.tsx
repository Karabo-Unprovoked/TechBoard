import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft, Plus, Search, Filter, Download, Printer, Eye, BarChart3, Users, Wrench, Clock, CheckCircle, AlertTriangle, Settings, User } from 'lucide-react';
import { supabase, isSupabaseConfigured, getUserRole } from '../lib/supabase';
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
import { UserProfile } from './UserProfile';
import type { NotificationType } from './Notification';

interface DashboardProps {
  onBack: () => void;
  onLogout: () => void;
  onTrackCustomer: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

type DashboardView = 'dashboard' | 'tickets' | 'customers' | 'new-customer' | 'new-ticket' | 'label' | 'manage-ticket' | 'manage-customer' | 'settings' | 'profile';

export const Dashboard: React.FC<DashboardProps> = ({ onBack, onLogout, onTrackCustomer, onNotification }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userRole, setUserRole] = useState<'admin' | 'technician' | 'viewer'>('viewer');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    loadData();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const role = await getUserRole();
      setUserRole(role as 'admin' | 'technician' | 'viewer');
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

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

  const PRIMARY = '#ffb400';
  const SIDEBAR_BG = '#2d3748';
  const ACCENT_BLUE = '#3b82f6';
  const ACCENT_GREEN = '#10b981';
  const ACCENT_ORANGE = '#f59e0b';

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
          backgroundColor: '#f1f5f9',
        }}
      >
        {/* Left Sidebar */}
        <div
          className="w-72 flex flex-col shadow-xl"
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Logo and Brand */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/FinalWhite.png"
                alt="Guardian Assist Logo"
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Guardian Assist</h1>
                <p className="text-xs text-white/60">Repair Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'dashboard' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 size={18} />
                <span className="text-sm">Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('tickets')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'tickets' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Wrench size={18} />
                <span className="text-sm">All Tickets</span>
              </button>
              <button
                onClick={() => setCurrentView('customers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'customers' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={18} />
                <span className="text-sm">All Customers</span>
              </button>
              <button
                onClick={onTrackCustomer}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all font-medium"
              >
                <Search size={18} />
                <span className="text-sm">Track Repair</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'settings' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'profile' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <User size={18} />
                <span className="text-sm">My Profile</span>
              </button>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
            <p className="text-xs text-white/40 text-center mt-3">
              © 2025 Guardian Assist
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentView === 'dashboard' && 'Dashboard'}
                  {currentView === 'tickets' && 'Repair Tickets'}
                  {currentView === 'customers' && 'Customer Management'}
                  {currentView === 'new-customer' && 'New Customer'}
                  {currentView === 'new-ticket' && 'New Repair Ticket'}
                  {currentView === 'label' && 'Ticket Label'}
                  {currentView === 'manage-ticket' && 'Manage Ticket'}
                  {currentView === 'manage-customer' && 'Manage Customer'}
                  {currentView === 'settings' && 'System Settings'}
                  {currentView === 'profile' && 'My Profile'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentView === 'dashboard' && 'Welcome back! Here\'s your overview'}
                  {currentView === 'tickets' && 'Manage and track repair tickets'}
                  {currentView === 'customers' && 'View and manage customer information'}
                  {currentView === 'new-customer' && 'Add a new customer to the system'}
                  {currentView === 'new-ticket' && 'Create a new repair ticket'}
                  {currentView === 'label' && 'Print ticket label for device tracking'}
                  {currentView === 'manage-ticket' && 'Complete ticket management and communication'}
                  {currentView === 'manage-customer' && 'View customer details and repair history'}
                  {currentView === 'settings' && 'Configure system settings and test functionality'}
                  {currentView === 'profile' && 'Manage your account details and security settings'}
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
          <div className="flex-1 p-8 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: PRIMARY }}></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Welcome Section */}
                    <div
                      className="rounded-2xl p-8 text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff9500 100%)`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Hello, Welcome back</h3>
                          <p className="text-orange-50 text-sm">Your dashboard is updated with the latest information</p>
                        </div>
                        {userRole !== 'viewer' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => setCurrentView('new-customer')}
                              className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-all"
                            >
                              <Users size={18} />
                              <span className="text-sm">New Customer</span>
                            </button>
                            <button
                              onClick={() => setCurrentView('new-ticket')}
                              className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl font-semibold hover:shadow-lg transition-all"
                              style={{ color: PRIMARY }}
                            >
                              <Plus size={18} />
                              <span className="text-sm">New Ticket</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-blue-50 p-3 rounded-xl">
                            <Wrench size={24} className="text-blue-600" />
                          </div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            +{stats.todayTickets} today
                          </span>
                        </div>
                        <h4 className="text-gray-600 text-sm font-medium mb-1">Total Tickets</h4>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-orange-50 p-3 rounded-xl">
                            <Clock size={24} className="text-orange-600" />
                          </div>
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                            {stats.totalTickets > 0 ? Math.round((stats.inProgressTickets / stats.totalTickets) * 100) : 0}%
                          </span>
                        </div>
                        <h4 className="text-gray-600 text-sm font-medium mb-1">In Progress</h4>
                        <p className="text-3xl font-bold text-gray-900">{stats.inProgressTickets}</p>
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-green-50 p-3 rounded-xl">
                            <CheckCircle size={24} className="text-green-600" />
                          </div>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            {stats.totalTickets > 0 ? Math.round((stats.completedTickets / stats.totalTickets) * 100) : 0}%
                          </span>
                        </div>
                        <h4 className="text-gray-600 text-sm font-medium mb-1">Completed</h4>
                        <p className="text-3xl font-bold text-gray-900">{stats.completedTickets}</p>
                      </div>
                    </div>

                    {/* Recent Tickets with Status Updates */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Latest Updates</h3>
                            <button
                              onClick={() => setCurrentView('tickets')}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              View All →
                            </button>
                          </div>

                          <div className="space-y-3">
                            {tickets.slice(0, 5).map((ticket) => (
                              <div key={ticket.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                                      <span className="font-semibold text-gray-900 text-sm">{ticket.ticket_number}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      {ticket.customer?.name} - {ticket.device_type}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleViewLabel(ticket)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                  >
                                    <Eye size={16} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between">
                                  <select
                                    value={ticket.status}
                                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                                  >
                                    <option value="received">Received</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="waiting-parts">Waiting Parts</option>
                                    <option value="completed">Completed</option>
                                    <option value="unrepairable">Unrepairable</option>
                                    <option value="pending-customer-action">Pending Customer Action</option>
                                  </select>

                                  <div className="text-right">
                                    <p className="text-xs text-gray-400 font-medium">
                                      {new Date(ticket.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Status Overview */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-5">Status Overview</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Received</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.pendingTickets}</span>
                          </div>
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">In Progress</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.inProgressTickets}</span>
                          </div>
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Waiting Parts</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.waitingPartsTickets}</span>
                          </div>
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                              <span className="text-sm text-gray-600 font-medium">Completed</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.completedTickets}</span>
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
                    onNotification={onNotification}
                  />
                )}
                {currentView === 'new-customer' && userRole !== 'viewer' && (
                  <CustomerForm onCustomerCreated={handleCustomerCreated} />
                )}
                {currentView === 'new-ticket' && userRole !== 'viewer' && (
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
                  <SystemSettings
                    onBack={() => setCurrentView('dashboard')}
                    onNotification={onNotification}
                  />
                )}
                {currentView === 'profile' && (
                  <UserProfile />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};