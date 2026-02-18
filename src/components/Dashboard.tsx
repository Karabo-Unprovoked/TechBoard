import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft, Plus, Search, Filter, Download, Printer, Eye, QrCode, BarChart3, Users, Wrench, Clock, CheckCircle, AlertTriangle, Settings, User, FileText, Menu, X } from 'lucide-react';
import { supabase, isSupabaseConfigured, getUserRole } from '../lib/supabase';
import type { Customer, RepairTicket, TicketStatus } from '../lib/supabase';
import { loadStatuses, getStatusLabel, getStatusDisplayColors } from '../lib/statusUtils';
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
import { RegistrationRequests } from './RegistrationRequests';
import { CustomizableDashboard } from './CustomizableDashboard';
import type { NotificationType } from './Notification';

interface DashboardProps {
  onBack: () => void;
  onLogout: () => void;
  onTrackCustomer: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

type DashboardView = 'dashboard' | 'tickets' | 'customers' | 'new-customer' | 'new-ticket' | 'label' | 'manage-ticket' | 'manage-customer' | 'settings' | 'profile' | 'registration-requests';

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
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [customerFormKey, setCustomerFormKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    loadData();
    loadUserRole();
    loadStatusesData();
    loadPendingRequests();
  }, []);

  const loadStatusesData = async () => {
    const data = await loadStatuses();
    setStatuses(data);
  };

  const loadPendingRequests = async () => {
    try {
      if (!isSupabaseConfigured) return;

      const { count, error } = await supabase
        .from('registration_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequests(count || 0);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

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

  const handleCustomerCreated = (customer: Customer, createTicket: boolean = true) => {
    setCustomers(prev => [customer, ...prev]);
    setCustomerFormKey(prev => prev + 1);
    if (createTicket) {
      setCurrentView('new-ticket');
    } else {
      setCurrentView('customers');
      onNotification('success', 'Customer created successfully!');
    }
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

  const updateTicketStatus = async (ticketId: string, newStatus: string, internalStatus?: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (internalStatus !== undefined) {
        updateData.internal_status = internalStatus;
      }

      const { error } = await supabase
        .from('repair_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, ...updateData }
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  // Calculate dashboard stats dynamically based on loaded statuses
  const stats: any = {
    totalTickets: tickets.length,
    totalCustomers: customers.length,
    todayTickets: tickets.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.created_at).toDateString() === today;
    }).length,
    weeklyRevenue: tickets.filter(t => t.status === 'completed').length * 150 // Mock calculation
  };

  // Dynamically add stats for each status
  statuses.forEach(status => {
    const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
    stats[statusKey] = tickets.filter(t => t.status === status.status_key).length;
  });

  // Always ensure standard status keys exist for backwards compatibility
  stats.pendingTickets = stats.pendingTickets || tickets.filter(t => t.status === 'pending').length;
  stats.receivedTickets = stats.receivedTickets || tickets.filter(t => t.status === 'received').length;
  stats.inProgressTickets = stats.inprogressTickets || tickets.filter(t => t.status === 'in-progress').length;
  stats.invoicedTickets = stats.invoicedTickets || tickets.filter(t => t.status === 'invoiced').length;
  stats.completedTickets = stats.completedTickets || tickets.filter(t => t.status === 'completed').length;
  stats.unrepairableTickets = stats.unrepairableTickets || tickets.filter(t => t.status === 'unrepairable').length;
  stats.pendingCustomerTickets = stats.pendingcustomeractionTickets || tickets.filter(t => t.status === 'pending-customer-action').length;

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
        className="min-h-screen flex overflow-x-hidden w-full max-w-full"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          backgroundColor: '#f1f5f9',
        }}
      >
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>

          {/* Logo and Brand */}
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/FinalWhite.png"
                alt="Guardian Assist Logo"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white">Guardian Assist</h1>
                <p className="text-xs text-white/60">Repair Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-1">
              <button
                onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'dashboard' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <BarChart3 size={18} />
                <span className="text-sm">Dashboard</span>
              </button>
              <button
                onClick={() => { setCurrentView('tickets'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'tickets' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Wrench size={18} />
                <span className="text-sm">All Tickets</span>
              </button>
              <button
                onClick={() => { setCurrentView('customers'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'customers' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={18} />
                <span className="text-sm">All Customers</span>
              </button>
              <button
                onClick={() => { onTrackCustomer(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all font-medium"
              >
                <Search size={18} />
                <span className="text-sm">Track Repair</span>
              </button>
              <button
                onClick={() => { setCurrentView('registration-requests'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'registration-requests' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileText size={18} />
                <span className="text-sm">Registration Requests</span>
                {pendingRequests > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'settings' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm">Settings</span>
              </button>
              <button
                onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }}
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
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 overflow-x-hidden">
            <div className="flex items-center justify-between gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>

              <div className="flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
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
                  {currentView === 'registration-requests' && 'Registration Requests'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
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
                  {currentView === 'registration-requests' && 'Review and approve customer registration requests'}
                </p>
              </div>
              
              {currentView === 'tickets' && (
                <div className="hidden md:flex items-center gap-4">
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
                    {statuses.map((status) => (
                      <option key={status.id} value={status.status_key}>
                        {status.status_label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
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
                  <div className="space-y-4 sm:space-y-6">
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

                    <CustomizableDashboard
                      tickets={tickets}
                      customers={customers}
                      pendingRequests={pendingRequests}
                      statuses={statuses}
                      userRole={userRole}
                      onNavigate={setCurrentView}
                      onViewLabel={handleViewLabel}
                      onManageTicket={handleManageTicket}
                      onUpdateStatus={updateTicketStatus}
                    />
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
                  <CustomerForm key={customerFormKey} onCustomerCreated={handleCustomerCreated} />
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
                    onTicketDeleted={() => {
                      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                      setSelectedTicket(null);
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
                    onViewTicket={handleManageTicket}
                    onNotification={onNotification}
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
                {currentView === 'registration-requests' && (
                  <RegistrationRequests
                    onNotification={onNotification}
                    onRequestsChanged={loadPendingRequests}
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