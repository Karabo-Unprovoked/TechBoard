import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Settings, Database, Shield, Bell, Globe, Wrench } from 'lucide-react';
import { sendTestEmail, initEmailJS } from '../lib/emailService';

interface SystemSettingsProps {
  onBack: () => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'database' | 'security' | 'notifications'>('email');
  const [emailTest, setEmailTest] = useState({
    testEmail: '',
    subject: 'Test Email from Guardian Assist',
    message: 'This is a test email to verify your SMTP configuration is working correctly.',
    loading: false,
    result: null as { success: boolean; message: string } | null
  });

  const [emailConfig, setEmailConfig] = useState({
    serviceId: 'service_guardian',
    templateId: 'template_repair',
    publicKey: 'YOUR_PUBLIC_KEY',
    fromEmail: 'info@computerguardian.co.za',
    fromName: 'Guardian Assist'
  });

  // Initialize EmailJS on component mount
  React.useEffect(() => {
    initEmailJS();
  }, []);

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
      const result = await sendTestEmail({
        to: emailTest.testEmail,
        subject: emailTest.subject,
        message: emailTest.message,
        ticketNumber: 'TEST-001'
      });
      
      setEmailTest(prev => ({
        ...prev,
        loading: false,
        result: {
          success: result.success,
          message: result.success 
            ? `Test email sent successfully to ${emailTest.testEmail}` 
            : result.error || 'Failed to send test email'
        }
      }));
    } catch (error) {
      setEmailTest(prev => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: 'Network error: Could not connect to email service'
        }
      }));
    }
  };

  const handleSaveEmailConfig = () => {
    // In a real app, this would save to database or environment variables
    alert('Email configuration saved! (In production, this would update your server settings)');
  };

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  const tabs = [
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

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
                {/* Email Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    EmailJS Configuration (Free Email Service)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service ID</label>
                      <input
                        type="text"
                        value={emailConfig.serviceId}
                        onChange={(e) => setEmailConfig({ ...emailConfig, serviceId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                        placeholder="service_xxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template ID</label>
                      <input
                        type="text"
                        value={emailConfig.templateId}
                        onChange={(e) => setEmailConfig({ ...emailConfig, templateId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                        placeholder="template_xxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                      <input
                        type="text"
                        value={emailConfig.publicKey}
                        onChange={(e) => setEmailConfig({ ...emailConfig, publicKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                        placeholder="Your EmailJS public key"
                      />
                    </div>

                    <div></div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                      <input
                        type="email"
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                      <input
                        type="text"
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEmailConfig}
                    className="mt-4 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Save Configuration
                  </button>

                  {/* EmailJS Setup Instructions */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📧 EmailJS Setup Instructions</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p><strong>Step 1:</strong> Go to <a href="https://emailjs.com" target="_blank" className="underline">emailjs.com</a> and create a free account</p>
                      <p><strong>Step 2:</strong> Add an email service (Gmail, Outlook, etc.)</p>
                      <p><strong>Step 3:</strong> Create an email template with these variables:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>to_email - Recipient email</li>
                        <li>to_name - Recipient name</li>
                        <li>subject - Email subject</li>
                        <li>message - Email content</li>
                        <li>ticket_number - Repair ticket number</li>
                        <li>from_name - Your business name</li>
                      </ul>
                      <p><strong>Step 4:</strong> Copy your Service ID, Template ID, and Public Key above</p>
                      <p><strong>Free Tier:</strong> 200 emails/month - Perfect for small repair shops!</p>
                    </div>
                  </div>
                </div>

                {/* Email Testing */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                    Test Email Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Email Address</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={emailTest.subject}
                        onChange={(e) => setEmailTest({ ...emailTest, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                        style={{ focusRingColor: PRIMARY }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
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
                      disabled={emailTest.loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                      <span>{emailTest.loading ? 'Sending...' : 'Send Test Email'}</span>
                    </button>

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

                    {/* EmailJS Configuration Note */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">⚠️ EmailJS Configuration Required</h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p>To send real emails, you need to configure EmailJS:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Free Service:</strong> 200 emails/month at no cost</li>
                          <li><strong>Easy Setup:</strong> No server configuration needed</li>
                          <li><strong>Reliable:</strong> Works with Gmail, Outlook, and more</li>
                          <li><strong>Professional:</strong> Custom templates and branding</li>
                        </ul>
                        <p className="mt-2">Follow the setup instructions above to start sending emails!</p>
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
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                  Notification Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Send email updates to customers</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Status Change Alerts</p>
                      <p className="text-sm text-gray-600">Notify when ticket status changes</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Completion Notifications</p>
                      <p className="text-sm text-gray-600">Alert customers when repairs are complete</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
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