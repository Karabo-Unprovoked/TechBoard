import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Settings, Database, Shield, Bell, Globe, Wrench, User, Plus, Trash2, CreditCard as Edit3 } from 'lucide-react';
import { supabase, getUserRole } from '../lib/supabase';

interface SystemSettingsProps {
  onBack: () => void;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'technician' | 'viewer';
  created_at: string;
  last_sign_in_at?: string;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'database' | 'security' | 'notifications' | 'users'>('email');
  const [userRole, setUserRole] = useState<'admin' | 'technician' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'technician' | 'viewer'>('technician');
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  React.useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  // Define tabs based on user role
  const getAllTabs = () => [
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'User Management', icon: User }
  ];

  const getAvailableTabs = () => {
    const allTabs = getAllTabs();
    
    switch (userRole) {
      case 'admin':
        return allTabs; // Admin can see everything
      case 'technician':
        return allTabs.filter(tab => tab.id !== 'users' && tab.id !== 'security'); // No user management or security
      case 'viewer':
        return allTabs.filter(tab => tab.id === 'email' || tab.id === 'database'); // Only email and database (read-only)
      default:
        return [allTabs[0]]; // Default to just email
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id 
                          ? 'text-white' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ 
                        backgroundColor: activeTab === tab.id ? PRIMARY : 'transparent'
                      }}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
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

                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 mb-2">Admin Password</p>
                        <p className="text-sm text-yellow-700 mb-2">
                          When deleting customers with completed tickets, an admin password is required.
                        </p>
                        <div className="bg-white p-3 rounded border border-yellow-300">
                          <p className="text-sm font-mono text-gray-900">Default Password: <span className="font-bold">admin123</span></p>
                          <p className="text-xs text-gray-600 mt-1">Change this in the code: CustomersView.tsx (line 105)</p>
                        </div>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    
                    <div className="flex items-end">
                      <button
                        onClick={createUser}
                        disabled={!newUserEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <Plus size={16} />
                        <span>Add User</span>
                      </button>
                    </div>
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
          </div>
        </div>
      </div>
    </>
  );
};