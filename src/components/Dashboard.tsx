import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft, Plus, Search, Filter, Download, Printer, Eye, QrCode, BarChart3, Users, Wrench, Clock, CheckCircle, AlertTriangle, Settings, User, FileText, Menu, X, LayoutGrid, List, Columns2 as Columns } from 'lucide-react';
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
import { StatusChangeModal } from './StatusChangeModal';
import { SLABadge } from './SLABadge';
import { SLADashboard } from './SLADashboard';
import { generateStatusUpdateEmail } from '../lib/emailTemplates';
import type { NotificationType } from './Notification';

interface DashboardProps {
  onBack: () => void;
  onLogout: () => void;
  onTrackCustomer: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

type DashboardView = 'dashboard' | 'tickets' | 'customers' | 'new-customer' | 'new-ticket' | 'label' | 'manage-ticket' | 'manage-customer' | 'settings' | 'profile' | 'registration-requests' | 'sla-dashboard';
type TicketViewLayout = 'detailed' | 'compact' | 'minimal';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ticketViewLayout, setTicketViewLayout] = useState<TicketViewLayout>('detailed');
  const [statusChangeModal, setStatusChangeModal] = useState<{
    isOpen: boolean;
    ticketId: string;
    currentStatus: string;
    newStatus: string;
    customerEmail: string;
    customerName: string;
    internalStatus?: string;
  } | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    loadData();
    loadUserRole();
    loadStatusesData();
    loadPendingRequests();
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      if (!isSupabaseConfigured) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('dashboard_view, sidebar_collapsed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        if (data.dashboard_view) {
          setTicketViewLayout(data.dashboard_view as TicketViewLayout);
        }
        if (data.sidebar_collapsed !== undefined) {
          setSidebarCollapsed(data.sidebar_collapsed);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const saveUserPreference = async (layout: TicketViewLayout) => {
    try {
      if (!isSupabaseConfigured) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          dashboard_view: layout,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user preference:', error);
    }
  };

  const handleLayoutChange = (layout: TicketViewLayout) => {
    setTicketViewLayout(layout);
    saveUserPreference(layout);
  };

  const toggleSidebar = async () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);

    try {
      if (!isSupabaseConfigured) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          sidebar_collapsed: newCollapsedState,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving sidebar preference:', error);
    }
  };

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
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (ticket.status === newStatus && ticket.internal_status === internalStatus) {
      return;
    }

    const customerEmail = ticket.customer?.email || '';
    const customerName = ticket.customer ?
      `${ticket.customer.first_name} ${ticket.customer.last_name}` :
      'Customer';

    setStatusChangeModal({
      isOpen: true,
      ticketId,
      currentStatus: ticket.status,
      newStatus,
      customerEmail,
      customerName,
      internalStatus
    });
  };

  const confirmStatusChange = async (sendEmail: boolean) => {
    if (!statusChangeModal) return;

    try {
      const { ticketId, newStatus, internalStatus } = statusChangeModal;

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

      if (sendEmail && statusChangeModal.customerEmail) {
        const ticket = tickets.find(t => t.id === ticketId);
        const statusLabel = getStatusLabel(statuses, newStatus);

        const emailHtml = generateStatusUpdateEmail(
          statusChangeModal.customerName,
          ticket?.ticket_number || '',
          ticket?.device_type || 'Device',
          statusLabel
        );

        console.log('Sending email to:', statusChangeModal.customerEmail);

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: statusChangeModal.customerEmail,
            subject: `Repair Status Update - Ticket ${ticket?.ticket_number}`,
            htmlContent: emailHtml,
            ticketNumber: ticket?.ticket_number || ''
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          onNotification('warning', 'Status updated but email failed to send');
        } else {
          console.log('Email sent successfully:', emailResult);
        }
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, ...updateData }
          : ticket
      ));

      setStatusChangeModal(null);
      onNotification('success', 'Status updated successfully' + (sendEmail ? ' and email sent' : ''));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      onNotification('error', 'Failed to update status');
    }
  };

  const updateTicketSubStatus = async (ticketId: string, newSubStatus: string | null) => {
    try {
      const updateData: any = {
        internal_status: newSubStatus || null,
        updated_at: new Date().toISOString()
      };

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
      console.error('Error updating ticket sub-status:', error);
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
  const SIDEBAR_BG = '#3D3D3D';
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
          className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shadow-xl transform transition-all duration-300 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed ? 'w-20' : 'w-72'}`}
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block absolute -right-3 top-8 z-50 p-1.5 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-900 transition-colors border border-gray-200"
          >
            {sidebarCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          {/* Logo and Brand */}
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <img
                src="/FinalWhite.png"
                alt="Guardian Assist Logo"
                className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} transition-all duration-300`}
              />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white">Guardian Assist</h1>
                  <p className="text-xs text-white/60">Repair Management</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-1">
              <button
                onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'dashboard' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'Dashboard' : ''}
              >
                <BarChart3 size={18} />
                {!sidebarCollapsed && <span className="text-sm">Dashboard</span>}
              </button>
              <button
                onClick={() => { setCurrentView('tickets'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'tickets' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'All Tickets' : ''}
              >
                <Wrench size={18} />
                {!sidebarCollapsed && <span className="text-sm">All Tickets</span>}
              </button>
              <button
                onClick={() => { setCurrentView('customers'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'customers' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'All Customers' : ''}
              >
                <Users size={18} />
                {!sidebarCollapsed && <span className="text-sm">All Customers</span>}
              </button>
              <button
                onClick={() => { onTrackCustomer(); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all font-medium`}
                title={sidebarCollapsed ? 'Track Repair' : ''}
              >
                <Search size={18} />
                {!sidebarCollapsed && <span className="text-sm">Track Repair</span>}
              </button>
              <button
                onClick={() => { setCurrentView('registration-requests'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all relative ${
                  currentView === 'registration-requests' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'Registration Requests' : ''}
              >
                <FileText size={18} />
                {!sidebarCollapsed && <span className="text-sm">Registration Requests</span>}
                {pendingRequests > 0 && (
                  <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                    {pendingRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setCurrentView('sla-dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'sla-dashboard' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'SLA Dashboard' : ''}
              >
                <Clock size={18} />
                {!sidebarCollapsed && <span className="text-sm">SLA Dashboard</span>}
              </button>
              <button
                onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'settings' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'Settings' : ''}
              >
                <Settings size={18} />
                {!sidebarCollapsed && <span className="text-sm">Settings</span>}
              </button>
              <button
                onClick={() => { setCurrentView('profile'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl font-medium transition-all ${
                  currentView === 'profile' ? 'bg-white text-gray-800 shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? 'My Profile' : ''}
              >
                <User size={18} />
                {!sidebarCollapsed && <span className="text-sm">My Profile</span>}
              </button>
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-medium`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span className="text-sm">Logout</span>}
            </button>
            {!sidebarCollapsed && (
              <p className="text-xs text-white/40 text-center mt-3">
                © 2025 Guardian Assist
              </p>
            )}
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
                  {currentView === 'sla-dashboard' && 'SLA Dashboard'}
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
                  {currentView === 'sla-dashboard' && 'Monitor service level agreements and ticket breach status'}
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
                    {/* Welcome Section */}
                    <div
                      className="rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff9500 100%)`
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Hello, Welcome back</h3>
                          <p className="text-orange-50 text-xs sm:text-sm">Your dashboard is updated with the latest information</p>
                        </div>
                        {userRole !== 'viewer' && (
                          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => setCurrentView('new-customer')}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl font-semibold hover:bg-white/30 transition-all text-sm"
                            >
                              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                              <span className="text-xs sm:text-sm">New Customer</span>
                            </button>
                            <button
                              onClick={() => setCurrentView('new-ticket')}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
                              style={{ color: PRIMARY }}
                            >
                              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                              <span className="text-xs sm:text-sm">New Ticket</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                            <Wrench size={20} className="sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                            +{stats.todayTickets} today
                          </span>
                        </div>
                        <h4 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Tickets</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{stats.totalTickets}</p>

                        {/* Status Breakdown */}
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          {statuses.slice(0, 3).map((status) => {
                            const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
                            const count = stats[statusKey] || 0;
                            const percentage = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0;
                            const colors = getStatusDisplayColors(status.status_key);

                            return (
                              <div key={status.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                                  <span className="text-xs text-gray-600">{status.status_label}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-900">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('registration-requests')}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-orange-50 p-3 rounded-xl">
                            <FileText size={24} className="text-orange-600" />
                          </div>
                          {pendingRequests > 0 && (
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                              Needs Review
                            </span>
                          )}
                        </div>
                        <h4 className="text-gray-600 text-sm font-medium mb-1">Pending Registrations</h4>
                        <p className="text-3xl font-bold text-gray-900">{pendingRequests}</p>
                        <p className="text-xs text-gray-500 mt-2">Click to review requests</p>
                      </div>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('customers')}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-green-50 p-3 rounded-xl">
                            <Users size={24} className="text-green-600" />
                          </div>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            Active
                          </span>
                        </div>
                        <h4 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h4>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
                        <p className="text-xs text-gray-500 mt-2">Click to view all customers</p>
                      </div>
                    </div>

                    {/* SLA Breach Alert Block */}
                    {(() => {
                      const overdueTickets = tickets.filter(ticket => {
                        if (ticket.status === 'completed' || ticket.status === 'void') return false;
                        if (!ticket.status_changed_at || !ticket.sla_hours) return false;

                        const statusChangedAt = new Date(ticket.status_changed_at);
                        const now = new Date();
                        const msElapsed = now.getTime() - statusChangedAt.getTime();
                        const hoursElapsed = msElapsed / (1000 * 60 * 60);
                        return hoursElapsed >= ticket.sla_hours;
                      });

                      const criticalTickets = tickets.filter(ticket => {
                        if (ticket.status === 'completed' || ticket.status === 'void') return false;
                        if (!ticket.status_changed_at || !ticket.sla_hours) return false;

                        const statusChangedAt = new Date(ticket.status_changed_at);
                        const now = new Date();
                        const msElapsed = now.getTime() - statusChangedAt.getTime();
                        const hoursElapsed = msElapsed / (1000 * 60 * 60);
                        const percentageUsed = (hoursElapsed / ticket.sla_hours) * 100;
                        return percentageUsed >= 90 && percentageUsed < 100;
                      });

                      if (overdueTickets.length === 0 && criticalTickets.length === 0) return null;

                      return (
                        <div
                          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm border-2 border-red-200 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setCurrentView('sla-dashboard')}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-3 rounded-xl">
                                <AlertTriangle size={24} className="text-red-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">SLA Breach Alert</h3>
                                <p className="text-sm text-gray-600">Immediate attention required</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600">Overdue</span>
                              </div>
                              <p className="text-2xl font-bold text-red-600">{overdueTickets.length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span className="text-xs font-medium text-gray-600">Critical</span>
                              </div>
                              <p className="text-2xl font-bold text-orange-600">{criticalTickets.length}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600">Click to view detailed SLA dashboard</p>
                            <div className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                              <span>View Details</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Recent Tickets with Status Updates */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Latest Updates</h3>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => handleLayoutChange('detailed')}
                                  className={`p-2 rounded-md transition-all ${
                                    ticketViewLayout === 'detailed'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                  title="Detailed View"
                                >
                                  <LayoutGrid size={16} />
                                </button>
                                <button
                                  onClick={() => handleLayoutChange('compact')}
                                  className={`p-2 rounded-md transition-all ${
                                    ticketViewLayout === 'compact'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                  title="Compact View"
                                >
                                  <List size={16} />
                                </button>
                                <button
                                  onClick={() => handleLayoutChange('minimal')}
                                  className={`p-2 rounded-md transition-all ${
                                    ticketViewLayout === 'minimal'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                  title="Minimal View"
                                >
                                  <Columns size={16} />
                                </button>
                              </div>
                              <button
                                onClick={() => setCurrentView('tickets')}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                View All →
                              </button>
                            </div>
                          </div>

                          {/* Detailed View */}
                          {ticketViewLayout === 'detailed' && (
                            <div className="space-y-4">
                              {tickets.slice(0, 5).map((ticket) => (
                                <div key={ticket.id} className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900 text-base">{ticket.ticket_number}</span>
                                        <span className="text-sm font-medium text-gray-700">{ticket.customer?.name}</span>
                                        <span className="text-xs text-gray-500">• {ticket.device_type?.replace('-laptop', '').replace('-', ' ')}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleViewLabel(ticket)}
                                          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                          style={{ color: '#ffb400' }}
                                          title="View QR Label"
                                        >
                                          <QrCode size={16} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedTicket(ticket);
                                            setCurrentView('manage-ticket');
                                          }}
                                          className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                                          title="View Ticket"
                                        >
                                          <Eye size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3">
                                    {ticket.status_changed_at && ticket.sla_hours && (
                                      <div className="mb-3">
                                        <SLABadge ticket={ticket} size="medium" />
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-2 font-medium">Status</p>
                                        <div className="flex flex-wrap gap-2">
                                          {statuses.map((status) => {
                                            const colors = getStatusDisplayColors(status.status_key);
                                            const isActive = ticket.status === status.status_key;
                                            return (
                                              <button
                                                key={status.id}
                                                onClick={() => updateTicketStatus(ticket.id, status.status_key, '')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                  isActive
                                                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.ring}`
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                              >
                                                {status.status_label}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {(() => {
                                          const currentStatus = statuses.find(s => s.status_key === ticket.status);
                                          if (currentStatus?.sub_statuses && currentStatus.sub_statuses.length > 0) {
                                            return (
                                              <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 mb-2 font-medium">Additional Details</p>
                                                <div className="flex flex-wrap gap-2">
                                                  <button
                                                    onClick={() => updateTicketStatus(ticket.id, ticket.status, '')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                      !ticket.internal_status
                                                        ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300 ring-offset-1'
                                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                  >
                                                    None
                                                  </button>
                                                  {currentStatus.sub_statuses.map((subStatus) => {
                                                    const isActive = ticket.internal_status === subStatus.sub_status_key;
                                                    return (
                                                      <button
                                                        key={subStatus.id}
                                                        onClick={() => updateTicketStatus(ticket.id, ticket.status, subStatus.sub_status_key)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                          isActive
                                                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 ring-offset-1'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                      >
                                                        {subStatus.sub_status_label}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>

                                      <div className="text-right ml-4">
                                        <p className="text-xs text-gray-400 font-medium">
                                          {new Date(ticket.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Compact View */}
                          {ticketViewLayout === 'compact' && (
                            <div className="space-y-3">
                              {tickets.slice(0, 6).map((ticket) => {
                                const statusColors = getStatusDisplayColors(ticket.status);
                                return (
                                  <div key={ticket.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-all">
                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-3">
                                      <div className={`w-2 h-2 ${statusColors.dot} rounded-full`}></div>
                                      <span className="font-bold text-gray-900 text-sm">{ticket.ticket_number}</span>
                                      <span className="text-sm font-medium text-gray-700">{ticket.customer?.name}</span>
                                      <span className="text-xs text-gray-500">• {ticket.device_type?.replace('-laptop', '').replace('-', ' ')}</span>
                                    </div>
                                    <div className="px-3 py-2 flex items-center justify-between bg-white">
                                      <span className="text-xs text-gray-500">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setSelectedTicket(ticket);
                                          setCurrentView('manage-ticket');
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                                        title="View Ticket"
                                      >
                                        <Eye size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Minimal View */}
                          {ticketViewLayout === 'minimal' && (
                            <div className="space-y-1.5">
                              {tickets.slice(0, 8).map((ticket) => {
                                const statusLabel = getStatusLabel(statuses, ticket.status);
                                const colors = getStatusDisplayColors(ticket.status);
                                return (
                                  <button
                                    key={ticket.id}
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setCurrentView('manage-ticket');
                                    }}
                                    className="w-full group hover:bg-gray-50 rounded-lg px-4 py-3 transition-all text-left border border-transparent hover:border-gray-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-1.5 h-8 ${colors.dot} rounded-full`}></div>
                                        <span className="font-bold text-gray-900 text-sm min-w-[80px]">{ticket.ticket_number}</span>
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{ticket.customer?.name}</span>
                                        <span className="text-xs text-gray-400 hidden sm:block">
                                          {ticket.device_type?.replace('-laptop', '').replace('-', ' ')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 group-hover:bg-gray-200 transition-colors">
                                          {statusLabel}
                                        </span>
                                        <Eye size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Overview - Dynamic based on database */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-5">Status Overview</h3>
                        <div className="space-y-3">
                          {statuses.map((status) => {
                            const colors = getStatusDisplayColors(status.status_key);
                            const statusKey = status.status_key.replace(/-/g, '') + 'Tickets';
                            const count = stats[statusKey] || 0;

                            return (
                              <button
                                key={status.id}
                                onClick={() => {
                                  setStatusFilter(status.status_key);
                                  setCurrentView('tickets');
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer border border-transparent hover:border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900">{status.status_label}</span>
                                </div>
                                <span className="font-bold text-gray-900 group-hover:scale-110 transition-transform">{count}</span>
                              </button>
                            );
                          })}
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
                    onUpdateSubStatus={updateTicketSubStatus}
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
                {currentView === 'sla-dashboard' && (
                  <SLADashboard
                    tickets={tickets}
                    onViewTicket={handleManageTicket}
                    statuses={statuses}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {statusChangeModal && (
          <StatusChangeModal
            isOpen={statusChangeModal.isOpen}
            onClose={() => setStatusChangeModal(null)}
            onConfirm={confirmStatusChange}
            currentStatus={statusChangeModal.currentStatus}
            newStatus={statusChangeModal.newStatus}
            customerEmail={statusChangeModal.customerEmail}
            customerName={statusChangeModal.customerName}
          />
        )}
      </div>
    </>
  );
};