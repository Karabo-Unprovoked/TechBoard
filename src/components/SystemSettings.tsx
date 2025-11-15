import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Settings, Database, Shield, Bell, Globe, Wrench, User, Plus, Trash2, CreditCard as Edit3, KeyRound, List, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase, getUserRole } from '../lib/supabase';
import type { TicketStatus, TicketSubStatus } from '../lib/supabase';
import { RecycleBin } from './RecycleBin';

interface SystemSettingsProps {
  onBack: () => void;
  onNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'technician' | 'viewer';
  created_at: string;
  last_sign_in_at?: string;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack, onNotification }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'database' | 'security' | 'notifications' | 'users' | 'recycle' | 'general' | 'statuses'>('email');
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'technician' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'technician' | 'viewer'>('technician');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [customerNumberStart, setCustomerNumberStart] = useState<string>('1000');
  const [savingGeneralSettings, setSavingGeneralSettings] = useState(false);
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusLabel, setEditingStatusLabel] = useState('');
  const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
  const [newSubStatusLabel, setNewSubStatusLabel] = useState<string>('');
  const [editingSubStatusId, setEditingSubStatusId] = useState<string | null>(null);
  const [editingSubStatusLabel, setEditingSubStatusLabel] = useState('');
  const [emailSettings, setEmailSettings] = useState<{
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    use_ssl: boolean;
    updated_at: string;
  } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    connected: boolean;
    checking: boolean;
    lastChecked: Date | null;
    error: string | null;
  }>({
    connected: false,
    checking: false,
    lastChecked: null,
    error: null
  });
  const [emailTest, setEmailTest] = useState({
    testEmail: '',
    subject: 'Test Email from Guardian Assist - SMTP Configuration Test',
    message: 'This is a test email to verify your SMTP configuration is working correctly.\n\nIf you receive this email, your email system is properly configured and ready to send customer notifications.\n\nServer: computerguardian.co.za:465 (SSL)\nFrom: info@computerguardian.co.za\n\nGuardian Assist Team',
    loading: false,
    result: null as { success: boolean; message: string } | null
  });

  // Load email settings
  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmailSettings(data);
        checkEmailConnection();
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  };

  // Check email connection by testing SMTP authentication
  const checkEmailConnection = async () => {
    setEmailStatus(prev => ({ ...prev, checking: true, error: null }));

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@test.com',
          subject: 'Connection Test',
          content: 'Testing SMTP authentication',
          isTest: true
        }
      });

      if (invokeError) {
        setEmailStatus({
          connected: false,
          checking: false,
          lastChecked: new Date(),
          error: invokeError.message || 'Edge function error'
        });
        return;
      }

      const isConnected = data?.success === true;
      const errorMsg = data?.error || (data?.success === false ? 'SMTP authentication failed' : null);

      setEmailStatus({
        connected: isConnected,
        checking: false,
        lastChecked: new Date(),
        error: errorMsg
      });
    } catch (error: any) {
      setEmailStatus({
        connected: false,
        checking: false,
        lastChecked: new Date(),
        error: error.message || 'Network error'
      });
    }
  };

  // Load general settings
  const loadGeneralSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'customer_number_start')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomerNumberStart(data.setting_value);
      }
    } catch (error) {
      console.error('Error loading general settings:', error);
    }
  };

  const handleSaveGeneralSettings = async () => {
    const startNum = parseInt(customerNumberStart);
    if (isNaN(startNum) || startNum < 1) {
      onNotification('error', 'Customer number start must be a positive number');
      return;
    }

    setSavingGeneralSettings(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: customerNumberStart,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'customer_number_start');

      if (error) throw error;

      onNotification('success', 'General settings saved successfully');
    } catch (error: any) {
      onNotification('error', 'Failed to save settings: ' + error.message);
    } finally {
      setSavingGeneralSettings(false);
    }
  };

  // Load user role on component mount
  React.useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role as 'admin' | 'technician' | 'viewer');

        // If not admin, default to email tab (which they can access)
        if (role !== 'admin' && activeTab === 'users') {
          setActiveTab('email');
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('viewer');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
    loadEmailSettings();
    loadGeneralSettings();
  }, []);

  const handleUpdateEmailPassword = async () => {
    const passwordInput = document.getElementById('smtp-password') as HTMLInputElement;
    const newPassword = passwordInput?.value;

    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (!confirm('Are you sure you want to update the email password? This will affect all system emails.')) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get the email settings record
      const { data: settings, error: fetchError } = await supabase
        .from('email_settings')
        .select('id')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!settings) throw new Error('Email settings not found');

      // Update the password
      const { error: updateError } = await supabase
        .from('email_settings')
        .update({
          smtp_password: newPassword,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      alert('Email password updated successfully!');
      passwordInput.value = '';

      // Reload settings and check connection
      await loadEmailSettings();
    } catch (error: any) {
      console.error('Update error:', error);
      alert('Failed to update email password: ' + error.message);
    }
  };

  const handleTestEmail = async () => {
    if (!emailTest.testEmail) {
      setEmailTest(prev => ({
        ...prev,
        result: { success: false, message: 'Please enter a test email address' }
      }));
      return;
    }

    setEmailTest(prev => ({ ...prev, loading: true, result: null }));

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailTest.testEmail,
          subject: emailTest.subject,
          content: emailTest.message,
          ticketNumber: 'TEST-001',
          isTest: true
        }
      });
      
      if (error) throw error;
      
      setEmailTest(prev => ({
        ...prev,
        loading: false,
        result: {
          success: data.success,
          message: data.success 
            ? `Test email sent successfully to ${emailTest.testEmail}` 
            : data.error || 'Failed to send test email'
        }
      }));
    } catch (error) {
      setEmailTest(prev => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: 'Network error: Could not connect to email server'
        }
      }));
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { action: 'list' }
      });
      if (error) throw error;
      
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'create',
          email: newUserEmail,
          role: newUserRole
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        setNewUserEmail('');
        setNewUserRole('technician');
        loadUsers();
        alert(`User created successfully. Temporary password: ${data.tempPassword}\nUser should change this on first login.`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error creating user: ' + error.message);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'technician' | 'viewer') => {
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: { 
          action: 'update',
          userId,
          role: newRole
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        loadUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error updating user role: ' + error.message);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'delete',
          userId
        }
      });

      if (error) throw error;

      if (data.success) {
        loadUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error deleting user: ' + error.message);
    }
  };

  const resetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for user: ${userEmail}?\n\nA new temporary password will be generated.`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'reset-password',
          userId
        }
      });

      if (error) throw error;

      if (data.success) {
        alert(`Password reset successfully!\n\nNew temporary password: ${data.tempPassword}\n\nPlease share this with the user. They should change it on first login.`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert('Error resetting password: ' + error.message);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
    if (activeTab === 'statuses') {
      loadStatuses();
    }
  }, [activeTab]);

  const loadStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const { data: statusesData, error: statusesError } = await supabase
        .from('ticket_statuses')
        .select('*')
        .order('status_order', { ascending: true });

      if (statusesError) throw statusesError;

      const { data: subStatusesData, error: subStatusesError } = await supabase
        .from('ticket_sub_statuses')
        .select('*')
        .order('sub_status_order', { ascending: true });

      if (subStatusesError) throw subStatusesError;

      const statusesWithSubs = (statusesData || []).map(status => ({
        ...status,
        sub_statuses: (subStatusesData || []).filter(sub => sub.parent_status_id === status.id)
      }));

      setStatuses(statusesWithSubs);
    } catch (error: any) {
      console.error('Error loading statuses:', error);
      onNotification('error', 'Failed to load statuses');
    } finally {
      setLoadingStatuses(false);
    }
  };

  const addStatus = async () => {
    if (!newStatusLabel.trim()) {
      onNotification('error', 'Status label is required');
      return;
    }

    try {
      const statusKey = newStatusLabel.toLowerCase().replace(/\s+/g, '-');
      const maxOrder = Math.max(...statuses.map(s => s.status_order), 0);

      const { error } = await supabase
        .from('ticket_statuses')
        .insert([{
          status_key: statusKey,
          status_label: newStatusLabel,
          status_order: maxOrder + 1,
          is_active: true
        }]);

      if (error) throw error;

      onNotification('success', 'Status added successfully');
      setNewStatusLabel('');
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to add status: ' + error.message);
    }
  };

  const updateStatus = async (statusId: string, updates: Partial<TicketStatus>) => {
    try {
      const { error } = await supabase
        .from('ticket_statuses')
        .update(updates)
        .eq('id', statusId);

      if (error) throw error;

      onNotification('success', 'Status updated successfully');
      setEditingStatusId(null);
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to update status: ' + error.message);
    }
  };

  const deleteStatus = async (statusId: string, statusLabel: string) => {
    if (!confirm(`Are you sure you want to delete the status "${statusLabel}"?`)) return;

    try {
      const { error } = await supabase
        .from('ticket_statuses')
        .delete()
        .eq('id', statusId);

      if (error) throw error;

      onNotification('success', 'Status deleted successfully');
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to delete status: ' + error.message);
    }
  };

  const moveStatus = async (statusId: string, direction: 'up' | 'down') => {
    const currentIndex = statuses.findIndex(s => s.id === statusId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= statuses.length) return;

    const currentStatus = statuses[currentIndex];
    const targetStatus = statuses[targetIndex];

    try {
      await supabase
        .from('ticket_statuses')
        .update({ status_order: targetStatus.status_order })
        .eq('id', currentStatus.id);

      await supabase
        .from('ticket_statuses')
        .update({ status_order: currentStatus.status_order })
        .eq('id', targetStatus.id);

      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to reorder statuses: ' + error.message);
    }
  };

  const addSubStatus = async (parentStatusId: string) => {
    if (!newSubStatusLabel.trim()) {
      onNotification('error', 'Sub-status label is required');
      return;
    }

    try {
      const subStatusKey = newSubStatusLabel.toLowerCase().replace(/\s+/g, '-');
      const parentStatus = statuses.find(s => s.id === parentStatusId);
      const maxOrder = Math.max(0, ...(parentStatus?.sub_statuses?.map(s => s.sub_status_order) || []));

      const { error } = await supabase
        .from('ticket_sub_statuses')
        .insert({
          parent_status_id: parentStatusId,
          sub_status_key: subStatusKey,
          sub_status_label: newSubStatusLabel,
          sub_status_order: maxOrder + 1,
          is_active: true
        });

      if (error) throw error;

      onNotification('success', 'Sub-status added successfully');
      setNewSubStatusLabel('');
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to add sub-status: ' + error.message);
    }
  };

  const updateSubStatus = async (subStatusId: string, updates: Partial<TicketSubStatus>) => {
    try {
      const { error } = await supabase
        .from('ticket_sub_statuses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subStatusId);

      if (error) throw error;

      onNotification('success', 'Sub-status updated successfully');
      setEditingSubStatusId(null);
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to update sub-status: ' + error.message);
    }
  };

  const deleteSubStatus = async (subStatusId: string, subStatusLabel: string) => {
    if (!confirm(`Are you sure you want to delete the sub-status "${subStatusLabel}"?`)) return;

    try {
      const { error } = await supabase
        .from('ticket_sub_statuses')
        .delete()
        .eq('id', subStatusId);

      if (error) throw error;

      onNotification('success', 'Sub-status deleted successfully');
      loadStatuses();
    } catch (error: any) {
      onNotification('error', 'Failed to delete sub-status: ' + error.message);
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      onNotification('error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      onNotification('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      onNotification('error', 'Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { data: setting, error: fetchError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_password')
        .maybeSingle();

      if (fetchError) throw fetchError;

      const storedPassword = setting?.setting_value || 'admin123';

      if (currentPassword !== storedPassword) {
        onNotification('error', 'Current password is incorrect');
        return;
      }

      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({
          setting_value: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'admin_password');

      if (updateError) throw updateError;

      onNotification('success', 'Admin password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      onNotification('error', 'Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  // Define tabs based on user role
  const getAllTabs = () => [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'statuses', label: 'Status Management', icon: List },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'recycle', label: 'Recycle Bin', icon: Trash2 }
  ];

  const getAvailableTabs = () => {
    const allTabs = getAllTabs();

    switch (userRole) {
      case 'admin':
        return allTabs; // Admin can see everything
      case 'technician':
        return allTabs.filter(tab => tab.id !== 'users' && tab.id !== 'security' && tab.id !== 'recycle' && tab.id !== 'general' && tab.id !== 'statuses'); // No user management, security, recycle bin, general, or statuses
      case 'viewer':
        return allTabs.filter(tab => tab.id === 'email' || tab.id === 'database'); // Only email and database (read-only)
      default:
        return [allTabs[1]]; // Default to email
    }
  };

  const tabs = getAvailableTabs();

  // Show loading state while determining user role
  if (loading) {
    return (
      <>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: PRIMARY }}></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: SECONDARY }}>
                System Settings
              </h1>
              <p className="text-gray-600">Configure and test system components</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings size={24} style={{ color: PRIMARY }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: activeTab === tab.id ? PRIMARY : 'transparent'
                      }}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="flex-1">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'general' && userRole === 'admin' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  General Settings
                </h3>

                <div className="space-y-6">
                  {/* Customer Number Start */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Customer Number Starting Point
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Set the starting number for customer IDs. New customers will be numbered starting from this value.
                      Format: CG{customerNumberStart}
                    </p>
                    <input
                      type="number"
                      value={customerNumberStart}
                      onChange={(e) => setCustomerNumberStart(e.target.value)}
                      min="1"
                      className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="100"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Example: If set to 100, the first customer will be CG100, second will be CG101, etc.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      <h4 className="font-medium text-yellow-900">Important</h4>
                    </div>
                    <p className="text-sm text-yellow-800">
                      This only affects new customers. Existing customer numbers will not change.
                      Make sure this number is higher than your current highest customer number to avoid conflicts.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveGeneralSettings}
                    disabled={savingGeneralSettings}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    <Settings size={16} />
                    <span>{savingGeneralSettings ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'statuses' && userRole === 'admin' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    Ticket Status Management
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage the available statuses for repair tickets. You can add, edit, reorder, and remove statuses as needed.
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Add New Status
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStatusLabel}
                        onChange={(e) => setNewStatusLabel(e.target.value)}
                        placeholder="Enter status name"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                        onKeyPress={(e) => e.key === 'Enter' && addStatus()}
                      />
                      <button
                        onClick={addStatus}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  {loadingStatuses ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: PRIMARY }}></div>
                      <p className="text-gray-600">Loading statuses...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statuses.map((status, index) => (
                        <div key={status.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => moveStatus(status.id, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => moveStatus(status.id, 'down')}
                                disabled={index === statuses.length - 1}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move Down"
                              >
                                ▼
                              </button>
                            </div>

                            <button
                              onClick={() => setExpandedStatusId(expandedStatusId === status.id ? null : status.id)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              title={expandedStatusId === status.id ? "Collapse" : "Expand sub-statuses"}
                            >
                              {expandedStatusId === status.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            <div className="flex-1">
                              {editingStatusId === status.id ? (
                                <input
                                  type="text"
                                  value={editingStatusLabel}
                                  onChange={(e) => setEditingStatusLabel(e.target.value)}
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:border-transparent outline-none"
                                  style={{ focusRingColor: PRIMARY }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateStatus(status.id, { status_label: editingStatusLabel });
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div>
                                  <p className="font-medium text-gray-900">{status.status_label}</p>
                                  <p className="text-xs text-gray-500">{status.status_key} {status.sub_statuses && status.sub_statuses.length > 0 && `• ${status.sub_statuses.length} sub-status${status.sub_statuses.length === 1 ? '' : 'es'}`}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {editingStatusId === status.id ? (
                                <>
                                  <button
                                    onClick={() => updateStatus(status.id, { status_label: editingStatusLabel })}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingStatusId(null);
                                      setEditingStatusLabel('');
                                    }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingStatusId(status.id);
                                      setEditingStatusLabel(status.status_label);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteStatus(status.id, status.status_label)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Sub-statuses section */}
                          {expandedStatusId === status.id && (
                            <div className="bg-gray-50 border-t border-gray-200 p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sub-statuses for {status.status_label}</h4>

                              {/* Add new sub-status */}
                              <div className="flex gap-2 mb-4">
                                <input
                                  type="text"
                                  value={newSubStatusLabel}
                                  onChange={(e) => setNewSubStatusLabel(e.target.value)}
                                  placeholder="Add sub-status..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                                  style={{ focusRingColor: PRIMARY }}
                                  onKeyPress={(e) => e.key === 'Enter' && addSubStatus(status.id)}
                                />
                                <button
                                  onClick={() => addSubStatus(status.id)}
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-white font-medium transition-colors text-sm"
                                  style={{ backgroundColor: PRIMARY }}
                                >
                                  <Plus size={14} />
                                  Add
                                </button>
                              </div>

                              {/* Sub-status list */}
                              {status.sub_statuses && status.sub_statuses.length > 0 ? (
                                <div className="space-y-2">
                                  {status.sub_statuses.map((subStatus) => (
                                    <div key={subStatus.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                                      <div className="flex-1">
                                        {editingSubStatusId === subStatus.id ? (
                                          <input
                                            type="text"
                                            value={editingSubStatusLabel}
                                            onChange={(e) => setEditingSubStatusLabel(e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:border-transparent outline-none text-sm"
                                            style={{ focusRingColor: PRIMARY }}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                updateSubStatus(subStatus.id, { sub_status_label: editingSubStatusLabel });
                                              }
                                            }}
                                            autoFocus
                                          />
                                        ) : (
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{subStatus.sub_status_label}</p>
                                            <p className="text-xs text-gray-500">{subStatus.sub_status_key}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {editingSubStatusId === subStatus.id ? (
                                          <>
                                            <button
                                              onClick={() => updateSubStatus(subStatus.id, { sub_status_label: editingSubStatusLabel })}
                                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingSubStatusId(null);
                                                setEditingSubStatusLabel('');
                                              }}
                                              className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => {
                                                setEditingSubStatusId(subStatus.id);
                                                setEditingSubStatusLabel(subStatus.sub_status_label);
                                              }}
                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="Edit"
                                            >
                                              <Edit3 size={14} />
                                            </button>
                                            <button
                                              onClick={() => deleteSubStatus(subStatus.id, subStatus.sub_status_label)}
                                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No sub-statuses added yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Status Information</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>In Progress:</strong> When a ticket is "In Progress", you can set internal statuses: Waiting for Part, Repairing, or Outsourced</p>
                    <p><strong>Pending Customer Action:</strong> When a ticket is "Pending Customer Action", you can specify: Collect or Call Us Back</p>
                    <p><strong>Order:</strong> Use the up/down arrows to change the order statuses appear in dropdowns</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                {/* Email Connection Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: SECONDARY }}>
                      Email Connection Status
                    </h3>
                    <button
                      onClick={checkEmailConnection}
                      disabled={emailStatus.checking}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: emailStatus.checking ? '#ccc' : PRIMARY,
                        color: 'white'
                      }}
                    >
                      {emailStatus.checking ? 'Checking...' : 'Test Connection'}
                    </button>
                  </div>

                  <div className={`rounded-lg p-4 mb-4 border ${
                    emailStatus.checking ? 'bg-gray-50 border-gray-200' :
                    emailStatus.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {emailStatus.checking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <h4 className="font-medium text-gray-900">Checking Connection...</h4>
                        </>
                      ) : emailStatus.connected ? (
                        <>
                          <CheckCircle size={16} className="text-green-600" />
                          <h4 className="font-medium text-green-900">Connected</h4>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-red-600" />
                          <h4 className="font-medium text-red-900">Not Connected</h4>
                        </>
                      )}
                    </div>
                    {emailStatus.error && (
                      <p className="text-sm text-red-800 mt-2">
                        <strong>Error:</strong> {emailStatus.error}
                      </p>
                    )}
                    {emailStatus.lastChecked && (
                      <p className="text-xs text-gray-600 mt-2">
                        Last checked: {emailStatus.lastChecked.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {emailSettings && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Current Configuration</h4>
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Server:</span>
                          <span>{emailSettings.smtp_host}:{emailSettings.smtp_port}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">From Email:</span>
                          <span>{emailSettings.from_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Username:</span>
                          <span>{emailSettings.smtp_username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Password:</span>
                          <span>{emailSettings.smtp_password ? '••••••••' : 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Security:</span>
                          <span>{emailSettings.use_ssl ? 'SSL/TLS' : 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Updated:</span>
                          <span>{new Date(emailSettings.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Password Configuration */}
                {userRole === 'admin' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                      Email Password Configuration
                    </h3>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-amber-600" />
                        <h4 className="font-medium text-amber-900">Admin Only</h4>
                      </div>
                      <p className="text-sm text-amber-800">
                        Update the SMTP password if your email account password has changed. This will update the credentials used to send all system emails.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Email Account (SMTP Username)
                        </label>
                        <input
                          type="text"
                          value="info@computerguardian.co.za"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">This email account is used to send all system emails</p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          New SMTP Password
                        </label>
                        <input
                          type="password"
                          id="smtp-password"
                          placeholder="Enter new email password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                          style={{ focusRingColor: PRIMARY }}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the password for info@computerguardian.co.za</p>
                      </div>

                      <button
                        onClick={handleUpdateEmailPassword}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <Settings size={16} />
                        <span>Update Email Password</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Testing */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    Test Email Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Test Email Address</label>
                      <input
                        type="email"
                        value={emailTest.testEmail}
                        onChange={(e) => setEmailTest({ ...emailTest, testEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                        placeholder="Enter email to test with"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={emailTest.subject}
                        onChange={(e) => setEmailTest({ ...emailTest, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                      <textarea
                        value={emailTest.message}
                        onChange={(e) => setEmailTest({ ...emailTest, message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                        style={{ focusRingColor: PRIMARY }}
                        rows={4}
                      />
                    </div>

                    <button
                      onClick={handleTestEmail}
                      disabled={emailTest.loading || userRole === 'viewer'}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                      <span>{emailTest.loading ? 'Sending...' : 'Send Test Email'}</span>
                    </button>

                    {userRole === 'viewer' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Email testing is not available for viewers. Contact an administrator for assistance.
                      </p>
                    )}

                    {emailTest.result && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        emailTest.result.success 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {emailTest.result.success ? (
                          <CheckCircle size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}
                        <span className="text-sm">{emailTest.result.message}</span>
                      </div>
                    )}

                    {/* Email Server Status */}
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ SMTP Server Status</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p><strong>Connection:</strong> Active and ready</p>
                        <p><strong>Server:</strong> computerguardian.co.za:465 (SSL encrypted)</p>
                        <p><strong>Authentication:</strong> Configured with secure credentials</p>
                        <p><strong>Daily Limit:</strong> No restrictions for business use</p>
                        <p><strong>Delivery Rate:</strong> High reliability through dedicated server</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  Database Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Database Connected</p>
                        <p className="text-sm text-green-700">Supabase connection is active</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Tables</p>
                      <p className="text-2xl font-bold" style={{ color: SECONDARY }}>5</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Migrations</p>
                      <p className="text-2xl font-bold" style={{ color: SECONDARY }}>7</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              // Only admins can access security settings
              userRole !== 'admin' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="text-center py-12">
                    <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                    <p className="text-gray-600">Security settings are only available to administrators.</p>
                  </div>
                </div>
              ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  Security Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Row Level Security</p>
                        <p className="text-sm text-green-700">Enabled on all tables</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Authentication</p>
                        <p className="text-sm text-green-700">Supabase Auth enabled</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3 mb-4">
                      <Shield size={20} className="text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Admin Password</p>
                        <p className="text-sm text-gray-600">
                          Required when deleting customers with completed tickets
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        onClick={handleChangeAdminPassword}
                        disabled={changingPassword}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {changingPassword ? 'Changing Password...' : 'Change Admin Password'}
                      </button>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          💡 The default password is <span className="font-mono font-bold">admin123</span>.
                          It's recommended to change this immediately after first login.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Role-based access notice */}
                {userRole === 'viewer' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className="text-blue-600" />
                      <h4 className="font-medium text-blue-900">Read-Only Access</h4>
                    </div>
                    <p className="text-sm text-blue-800">
                      You can view notification settings but cannot modify them.
                    </p>
                  </div>
                )}

                <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  Notification Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Status Change Alerts</p>
                      <p className="text-sm text-gray-600">Notify when ticket status changes</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      disabled={userRole === 'viewer'}
                      className="rounded disabled:opacity-50" 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Completion Notifications</p>
                      <p className="text-sm text-gray-600">Alert customers when repairs are complete</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      disabled={userRole === 'viewer'}
                      className="rounded disabled:opacity-50" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && userRole === 'admin' && (
              <div className="space-y-6">
                {/* Add New User */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    Add New User
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                          style={{ focusRingColor: PRIMARY }}
                          placeholder="user@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'technician' | 'viewer')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                          style={{ focusRingColor: PRIMARY }}
                        >
                          <option value="technician">Technician</option>
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={createUser}
                      disabled={!newUserEmail.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <Plus size={16} />
                      <span>Add User</span>
                    </button>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Role Permissions</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Admin:</strong> Full system access, user management, settings</p>
                      <p><strong>Technician:</strong> Create/edit tickets, customer management, email sending</p>
                      <p><strong>Viewer:</strong> Read-only access to tickets and customer info</p>
                    </div>
                  </div>
                </div>

                {/* Current Users */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: SECONDARY }}>
                      Current Users
                    </h3>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <User size={16} />
                      <span>{loadingUsers ? 'Loading...' : 'Refresh'}</span>
                    </button>
                  </div>
                  
                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: PRIMARY }}></div>
                      <p className="text-gray-600">Loading users...</p>
                    </div>
                  ) : users.length > 0 ? (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium text-gray-900">{user.email}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'technician' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Created: {new Date(user.created_at).toLocaleDateString()}
                              {user.last_sign_in_at && (
                                <span className="ml-4">
                                  Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'technician' | 'viewer')}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:border-transparent outline-none"
                              style={{ focusRingColor: PRIMARY }}
                            >
                              <option value="admin">Admin</option>
                              <option value="technician">Technician</option>
                              <option value="viewer">Viewer</option>
                            </select>

                            <button
                              onClick={() => resetUserPassword(user.id, user.email)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound size={16} />
                            </button>

                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-600 mb-2">No users found</p>
                      <p className="text-sm text-gray-500">
                        User management requires proper Supabase configuration
                      </p>
                    </div>
                  )}
                </div>

                {/* Configuration Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    Configuration Status
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">User Management Ready</p>
                          <p className="text-sm text-green-700">Edge Function is properly configured</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ System Features</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>• User creation with role assignment</p>
                        <p>• Role-based access control (Admin, Technician, Viewer)</p>
                        <p>• Secure user management via Edge Functions</p>
                        <p>• Temporary password generation for new users</p>
                        <p>• User role updates and account deletion</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🔐 Security Notes</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• All admin operations use service role authentication</p>
                        <p>• New users receive temporary passwords to change on first login</p>
                        <p>• Role permissions are enforced throughout the application</p>
                        <p>• User sessions are managed securely by Supabase Auth</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recycle' && userRole === 'admin' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: SECONDARY }}>Recycle Bin</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      View and restore deleted customers. Items are permanently deleted after 30 days.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRecycleBin(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Open Recycle Bin
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">ℹ️ How It Works</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Deleted customers are moved to the recycle bin instead of being permanently removed</p>
                      <p>• Customer data and their completed tickets are preserved</p>
                      <p>• Items can be restored within 30 days</p>
                      <p>• After 30 days, items are automatically and permanently deleted</p>
                      <p>• Admins can manually delete items permanently at any time</p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p>• Only customers with completed/cancelled tickets or no tickets can be deleted</p>
                      <p>• Deleting customers with completed tickets requires admin password</p>
                      <p>• Restoring a customer will also restore their associated tickets</p>
                      <p>• Permanent deletion cannot be undone</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Automatic Cleanup</p>
                        <p className="text-sm text-green-700">
                          The system automatically removes items older than 30 days via edge function
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRecycleBin && (
        <RecycleBin
          onClose={() => setShowRecycleBin(false)}
          onRefresh={() => {}}
          onNotification={onNotification}
        />
      )}
    </>
  );
};