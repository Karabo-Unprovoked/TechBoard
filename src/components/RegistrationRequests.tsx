import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Check, X, Mail, Phone, MapPin, Laptop, Calendar, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NotificationType } from './Notification';

interface RegistrationRequest {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  preferred_contact_method: string;
  referral_source?: string;
  needs_collection: boolean;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  laptop_brand?: string;
  laptop_model?: string;
  laptop_problem: string;
  serial_number?: string;
  device_includes?: string[];
  additional_notes?: string;
  device_images?: string[];
  status: 'pending' | 'approved' | 'declined';
  reviewed_by?: string;
  reviewed_at?: string;
  decline_reason?: string;
  created_at: string;
}

interface RegistrationRequestsProps {
  onNotification: (type: NotificationType, message: string) => void;
}

export const RegistrationRequests: React.FC<RegistrationRequestsProps> = ({ onNotification }) => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      onNotification('error', 'Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerNumber = async () => {
    const { data: setting } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'customer_number_start')
      .maybeSingle();

    const startNumber = setting?.setting_value ? parseInt(setting.setting_value) : 100;

    const { data: customers } = await supabase
      .from('customers')
      .select('customer_number')
      .order('customer_number', { ascending: false })
      .limit(1);

    if (!customers || customers.length === 0) {
      return `CG${startNumber}`;
    }

    const lastNumber = customers[0].customer_number;
    const numberPart = parseInt(lastNumber.replace('CG', ''), 10);
    const nextNumber = Math.max(numberPart + 1, startNumber);
    return `CG${nextNumber}`;
  };

  const handleApprove = async (request: RegistrationRequest) => {
    if (!confirm('Are you sure you want to approve this registration? This will create a customer and send them a confirmation email.')) {
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const customerNumber = await generateCustomerNumber();

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          customer_number: customerNumber,
          title: request.title,
          first_name: request.first_name,
          last_name: request.last_name,
          name: `${request.first_name} ${request.last_name}`,
          email: request.email,
          phone: request.phone_number,
          gender: request.title === 'Mr' ? 'Male' : request.title === 'Mrs' || request.title === 'Ms' ? 'Female' : undefined,
          referral_source: request.referral_source,
          preferred_contact_method: request.preferred_contact_method,
          needs_collection: request.needs_collection,
          street_address: request.street_address,
          address_line_2: request.address_line_2,
          city: request.city,
          province: request.province,
          postal_code: request.postal_code,
          country: request.country
        })
        .select()
        .single();

      if (customerError) throw customerError;

      const { data: tickets } = await supabase
        .from('repair_tickets')
        .select('ticket_number')
        .order('ticket_number', { ascending: false })
        .limit(1);

      let nextTicketNumber = 'TK1000';
      if (tickets && tickets.length > 0) {
        const lastNumber = parseInt(tickets[0].ticket_number.replace('TK', ''), 10);
        nextTicketNumber = `TK${lastNumber + 1}`;
      }

      const { data: ticket, error: ticketError } = await supabase
        .from('repair_tickets')
        .insert({
          ticket_number: nextTicketNumber,
          customer_id: customer.id,
          device_type: 'Laptop',
          brand: request.laptop_brand,
          model: request.laptop_model,
          serial_number: request.serial_number,
          issue_description: request.laptop_problem,
          device_accessories: request.device_includes,
          repair_notes: request.additional_notes,
          status: 'pending'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      if (request.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: request.email,
            subject: 'Registration Approved - Welcome!',
            html: `
              <h2>Registration Approved</h2>
              <p>Dear ${request.first_name} ${request.last_name},</p>
              <p>Your registration has been approved! We have created a customer profile and repair ticket for you.</p>
              <p><strong>Your Details:</strong></p>
              <ul>
                <li>Customer Number: ${customerNumber}</li>
                <li>Ticket Number: ${nextTicketNumber}</li>
              </ul>
              <p><strong>Device Details:</strong></p>
              <ul>
                <li>Brand: ${request.laptop_brand || 'Not specified'}</li>
                <li>Model: ${request.laptop_model || 'Not specified'}</li>
                <li>Problem: ${request.laptop_problem}</li>
              </ul>
              ${request.needs_collection ? '<p><strong>Collection & Delivery:</strong> You requested collection and delivery service. We will arrange this with you.</p>' : ''}
              <p>We will contact you shortly via ${request.preferred_contact_method} to discuss your device repair.</p>
              <p>Thank you for choosing our services!</p>
            `
          }
        });
      }

      onNotification('success', 'Registration approved - Customer and ticket created successfully');
      loadRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error approving request:', error);
      onNotification('error', 'Failed to approve registration: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest || !declineReason.trim()) {
      onNotification('warning', 'Please provide a reason for declining');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({
          status: 'declined',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          decline_reason: declineReason
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      if (selectedRequest.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: selectedRequest.email,
            subject: 'Registration Update',
            html: `
              <h2>Registration Update</h2>
              <p>Dear ${selectedRequest.first_name} ${selectedRequest.last_name},</p>
              <p>Thank you for your registration. Unfortunately, we are unable to proceed with your request at this time.</p>
              <p><strong>Reason:</strong> ${declineReason}</p>
              <p>If you have any questions, please feel free to contact us.</p>
            `
          }
        });
      }

      onNotification('success', 'Registration declined');
      loadRequests();
      setSelectedRequest(null);
      setShowDeclineModal(false);
      setDeclineReason('');
    } catch (error: any) {
      console.error('Error declining request:', error);
      onNotification('error', 'Failed to decline registration: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferralSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'google': 'Google Search',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'friend': 'Friend/Family',
      'repeat': 'Repeat Customer',
      'other': 'Other'
    };
    return labels[source] || source;
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: SECONDARY }}>
              Registration Requests
            </h2>
            <p className="text-gray-600">Review and approve customer registration requests</p>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'declined'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={filter === status ? { backgroundColor: PRIMARY } : {}}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({requests.filter(r => status === 'all' || r.status === status).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-800"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No {filter !== 'all' ? filter : ''} registration requests found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: SECONDARY }}>
                        {request.title} {request.first_name} {request.last_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.needs_collection && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Collection Needed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(request.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                      >
                        <Check size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDeclineModal(true);
                        }}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                      >
                        <X size={16} />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {request.status === 'declined' && request.decline_reason && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <strong>Declined:</strong> {request.decline_reason}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Contact</p>
                      <p className="text-sm text-gray-600">{request.phone_number}</p>
                      {request.email && <p className="text-sm text-gray-600">{request.email}</p>}
                      <p className="text-xs text-gray-500 mt-1">Prefers: {request.preferred_contact_method}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Laptop size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Device</p>
                      <p className="text-sm text-gray-600">
                        {request.laptop_brand || 'Unknown'} {request.laptop_model || ''}
                      </p>
                      {request.serial_number && (
                        <p className="text-xs text-gray-500">S/N: {request.serial_number}</p>
                      )}
                    </div>
                  </div>

                  {(request.street_address || request.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-600">
                          {request.street_address}
                          {request.address_line_2 && <>, {request.address_line_2}</>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.city}{request.province && `, ${request.province}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {request.referral_source && (
                    <div className="flex items-start gap-3">
                      <UserIcon size={16} className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">How They Found Us</p>
                        <p className="text-sm text-gray-600">{getReferralSourceLabel(request.referral_source)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Problem Description:</p>
                  <p className="text-sm text-gray-600">{request.laptop_problem}</p>
                </div>

                {request.additional_notes && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Additional Notes:</p>
                    <p className="text-sm text-gray-600">{request.additional_notes}</p>
                  </div>
                )}

                {request.device_includes && request.device_includes.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Device Includes:</p>
                    <div className="flex flex-wrap gap-2">
                      {request.device_includes.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {request.device_images && request.device_images.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Device Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {request.device_images.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Device ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-300 hover:opacity-75 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showDeclineModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: SECONDARY }}>
                Decline Registration
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for declining this registration request:
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for declining..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none mb-4"
                style={{ focusRingColor: PRIMARY }}
              />
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason('');
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={processing || !declineReason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {processing ? 'Declining...' : 'Decline Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
