import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Check, X, Mail, Phone, MapPin, Laptop, Calendar, User as UserIcon, Trash2, ArrowUpDown } from 'lucide-react';
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
  device_type?: string;
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
  onRequestsChanged?: () => void;
}

export const RegistrationRequests: React.FC<RegistrationRequestsProps> = ({ onNotification, onRequestsChanged }) => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearType, setClearType] = useState<'approved' | 'declined'>('approved');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<RegistrationRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter]);

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
    const { data: customers } = await supabase
      .from('customers')
      .select('customer_number');

    if (!customers || customers.length === 0) {
      return 'C1';
    }

    // Find the highest numeric value
    const numbers = customers
      .map(c => parseInt(c.customer_number.replace('C', ''), 10))
      .filter(n => !isNaN(n));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `C${nextNumber}`;
  };

  const handleApprove = async (request: RegistrationRequest) => {
    // Check for duplicate email first
    if (request.email?.trim()) {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', request.email.trim())
        .maybeSingle();

      if (existingCust) {
        // Duplicate email found - show merge modal
        setExistingCustomer(existingCust);
        setPendingRequest(request);
        setShowMergeModal(true);
        return;
      }
    }

    // No duplicate - proceed with normal approval
    await proceedWithApproval(request, false, null);
  };

  const proceedWithApproval = async (request: RegistrationRequest, shouldMerge: boolean, existingCustomerId: string | null) => {
    if (!shouldMerge && !confirm('Are you sure you want to approve this registration? This will create a customer and send them a confirmation email.')) {
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let customer;
      let customerNumber;

      if (shouldMerge && existingCustomerId) {
        // Merge: Update existing customer with new information
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            title: request.title,
            first_name: request.first_name,
            last_name: request.last_name,
            name: `${request.first_name} ${request.last_name}`,
            phone: request.phone_number,
            referral_source: request.referral_source || undefined,
            preferred_contact_method: request.preferred_contact_method,
            needs_collection: request.needs_collection,
            street_address: request.street_address,
            address_line_2: request.address_line_2,
            city: request.city,
            province: request.province,
            postal_code: request.postal_code,
            country: request.country
          })
          .eq('id', existingCustomerId)
          .select()
          .single();

        if (updateError) throw updateError;
        customer = updatedCustomer;
        customerNumber = customer.customer_number;
      } else {
        // Create new customer
        customerNumber = await generateCustomerNumber();

        const { data: newCustomer, error: customerError } = await supabase
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
        customer = newCustomer;
      }

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
          device_type: request.device_type || 'Laptop',
          brand: request.laptop_brand,
          model: request.laptop_model,
          serial_number: request.serial_number,
          issue_description: request.laptop_problem,
          device_accessories: request.device_includes,
          repair_notes: request.additional_notes,
          device_images: request.device_images,
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
        try {
          const customerDetailsHtml = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ffb400; margin-top: 0;">Your Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${request.first_name} ${request.last_name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${request.email}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${request.phone || 'Not provided'}</p>
              <p style="margin: 5px 0;"><strong>Preferred Contact:</strong> ${request.preferred_contact_method || 'Email'}</p>
              <p style="margin: 5px 0;"><strong>Customer Number:</strong> ${customerNumber}</p>
              <p style="margin: 10px 0 5px 0; font-size: 12px; color: #666;"><em>Please review these details and reply to this email if anything needs to be corrected.</em></p>
            </div>
          `;

          const ticketDetailsHtml = `
            <div style="margin: 20px 0;">
              <h3 style="color: #ffb400;">Your Active Ticket</h3>
              <div style="background: white; border: 2px solid #ffb400; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h4 style="color: #ffb400; margin: 0 0 10px 0;">Ticket: ${nextTicketNumber}</h4>
                <p style="margin: 5px 0;"><strong>Device Type:</strong> ${request.device_type}</p>
                ${request.laptop_brand ? `<p style="margin: 5px 0;"><strong>Brand:</strong> ${request.laptop_brand}</p>` : ''}
                ${request.laptop_model ? `<p style="margin: 5px 0;"><strong>Model:</strong> ${request.laptop_model}</p>` : ''}
                ${request.serial_number ? `<p style="margin: 5px 0;"><strong>Serial Number:</strong> ${request.serial_number}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Issue:</strong> ${request.laptop_problem}</p>
                ${request.device_accessories && request.device_accessories.length > 0 ?
                  `<p style="margin: 5px 0;"><strong>Device Came With:</strong> ${request.device_accessories.join(', ')}</p>`
                  : ''}
                ${request.needs_collection ?
                  `<div style="background: #e8f5e8; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <p style="margin: 0; color: #2d7a2d;"><strong>✓ Collection & Delivery:</strong> You requested collection and delivery service. We will arrange this with you.</p>
                  </div>`
                  : ''}
              </div>
            </div>
          `;

          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: request.email,
              subject: 'Registration Approved - Welcome to Computer Guardian!',
              ticketNumber: nextTicketNumber,
              content: `Dear ${request.first_name},

Welcome to Computer Guardian! We're delighted to have you as our customer.

Your registration has been approved and we have created your customer profile and repair ticket.

${customerDetailsHtml}

${ticketDetailsHtml}

We will contact you shortly via ${request.preferred_contact_method || 'email'} to keep you updated on your repair progress.

If you have any questions, please don't hesitate to reach out to us.

Thank you for choosing Computer Guardian!`
            }
          });

          if (emailError) {
            console.error('Email sending error:', emailError);
            onNotification('warning', 'Registration approved but welcome email failed to send. Use manual send button in customer profile.');
          } else if (emailResult && !emailResult.success) {
            console.error('Email failed:', emailResult);
            onNotification('warning', 'Registration approved but welcome email failed to send. Use manual send button in customer profile.');
          } else {
            console.log('Email sent successfully:', emailResult);
            onNotification('success', shouldMerge ? 'Registration approved - Ticket created. Welcome email sent successfully!' : 'Registration approved - Customer created. Welcome email sent successfully!');
            loadRequests();
            onRequestsChanged?.();
            setSelectedRequest(null);
            setShowMergeModal(false);
            setExistingCustomer(null);
            setPendingRequest(null);
            setProcessing(false);
            return;
          }
        } catch (emailErr) {
          console.error('Email exception:', emailErr);
          onNotification('warning', 'Registration approved but welcome email failed to send. Use manual send button in customer profile.');
        }
      } else {
        onNotification('success', shouldMerge ? 'Registration approved - Ticket created successfully (no email on file)' : 'Registration approved - Customer created successfully (no email on file)');
        loadRequests();
        onRequestsChanged?.();
        setSelectedRequest(null);
        setShowMergeModal(false);
        setExistingCustomer(null);
        setPendingRequest(null);
        setProcessing(false);
        return;
      }

      onNotification('success', shouldMerge ? 'Registration approved - Customer merged and ticket created' : 'Registration approved - Customer and ticket created');
      loadRequests();
      onRequestsChanged?.();
      setSelectedRequest(null);
      setShowMergeModal(false);
      setExistingCustomer(null);
      setPendingRequest(null);
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
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: selectedRequest.email,
              subject: 'Registration Update',
              content: `
                <h2>Registration Update</h2>
                <p>Dear ${selectedRequest.first_name} ${selectedRequest.last_name},</p>
                <p>Thank you for your registration. Unfortunately, we are unable to proceed with your request at this time.</p>
                <p><strong>Reason:</strong> ${declineReason}</p>
                <p>If you have any questions, please feel free to contact us.</p>
              `
            }
          });

          if (emailError) {
            console.error('Email sending error:', emailError);
            onNotification('warning', 'Registration declined but email notification failed. Please contact customer manually.');
          } else if (emailResult && !emailResult.success) {
            console.error('Email failed:', emailResult);
            onNotification('warning', 'Registration declined but email notification failed. Please contact customer manually.');
          } else {
            console.log('Decline email sent successfully:', emailResult);
          }
        } catch (emailErr) {
          console.error('Email exception:', emailErr);
          onNotification('warning', 'Registration declined but email notification failed. Please contact customer manually.');
        }
      }

      onNotification('success', 'Registration declined');
      loadRequests();
      onRequestsChanged?.();
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

  const handleClearList = async () => {
    if (!confirm(`Are you sure you want to delete all ${clearType} registration requests? This action cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('registration_requests')
        .delete()
        .eq('status', clearType);

      if (error) throw error;

      onNotification('success', `All ${clearType} requests cleared successfully`);
      loadRequests();
      onRequestsChanged?.();
      setShowClearModal(false);
    } catch (error: any) {
      console.error('Error clearing requests:', error);
      onNotification('error', 'Failed to clear requests: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReapprove = async (request: RegistrationRequest) => {
    await handleApprove(request);
  };

  const handleMergeConfirm = async () => {
    if (pendingRequest && existingCustomer) {
      await proceedWithApproval(pendingRequest, true, existingCustomer.id);
    }
  };

  const handleCreateNew = async () => {
    if (pendingRequest) {
      setShowMergeModal(false);
      setExistingCustomer(null);
      setPendingRequest(null);
      onNotification('warning', 'Cannot create new customer with duplicate email. Please update the email in the registration request or merge with existing customer.');
    }
  };

  const toggleSelectRequest = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.size === 0) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('registration_requests')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      onNotification('success', `Successfully deleted ${selectedIds.size} request(s)`);
      setSelectedIds(new Set());
      loadRequests();
      onRequestsChanged?.();
      setShowMassDeleteModal(false);
    } catch (error: any) {
      console.error('Error deleting requests:', error);
      onNotification('error', 'Failed to delete requests: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

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

      <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: SECONDARY }}>
              Registration Requests
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">Review and approve customer registration requests</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title={`Currently showing ${sortOrder === 'newest' ? 'newest first' : 'oldest first'}`}
            >
              <ArrowUpDown size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
              <span className="sm:hidden">{sortOrder === 'newest' ? 'New' : 'Old'}</span>
            </button>
            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
            {(['all', 'pending', 'approved', 'declined'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
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
          <div className="flex items-center gap-2">
            {(filter === 'approved' || filter === 'declined') && filteredRequests.length > 0 && (
              <button
                onClick={() => {
                  setClearType(filter);
                  setShowClearModal(true);
                }}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                <span>Clear {filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
              </button>
            )}
          </div>
        </div>

        {filteredRequests.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300 focus:ring-2 cursor-pointer"
                style={{ accentColor: PRIMARY }}
              />
              <span className="font-medium text-gray-700">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
              </span>
            </label>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowMassDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Selected</span>
              </button>
            )}
          </div>
        )}

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
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(request.id)}
                    onChange={() => toggleSelectRequest(request.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 focus:ring-2 cursor-pointer flex-shrink-0"
                    style={{ accentColor: PRIMARY }}
                  />
                  <div className="flex-1">
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

                  {request.status === 'declined' && (
                    <div className="flex items-center gap-3">
                      {request.decline_reason && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg flex-1">
                          <strong>Declined:</strong> {request.decline_reason}
                        </div>
                      )}
                      <button
                        onClick={() => handleReapprove(request)}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <Check size={16} />
                        <span>Approve</span>
                      </button>
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
                        {request.device_type && <span className="font-medium">{request.device_type}: </span>}
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
                </div>
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

        {showClearModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: SECONDARY }}>
                Clear {clearType.charAt(0).toUpperCase() + clearType.slice(1)} Requests
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to permanently delete all {clearType} registration requests? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will delete {requests.filter(r => r.status === clearType).length} {clearType} request(s) from the database.
                </p>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearList}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {processing ? 'Clearing...' : 'Yes, Clear List'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMergeModal && existingCustomer && pendingRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: SECONDARY }}>
                Duplicate Email Detected
              </h3>
              <p className="text-gray-600 mb-4">
                A customer with this email address already exists. Would you like to merge this registration with the existing customer or cancel?
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Existing Customer</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Number:</strong> {existingCustomer.customer_number}</p>
                    <p><strong>Name:</strong> {existingCustomer.first_name} {existingCustomer.last_name}</p>
                    <p><strong>Email:</strong> {existingCustomer.email}</p>
                    <p><strong>Phone:</strong> {existingCustomer.phone}</p>
                  </div>
                </div>
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-gray-900 mb-2">New Registration</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {pendingRequest.first_name} {pendingRequest.last_name}</p>
                    <p><strong>Email:</strong> {pendingRequest.email}</p>
                    <p><strong>Phone:</strong> {pendingRequest.phone_number}</p>
                    <p><strong>Device:</strong> {pendingRequest.device_type && `${pendingRequest.device_type}: `}{pendingRequest.laptop_brand} {pendingRequest.laptop_model}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Merge Action:</strong> The existing customer will be updated with new information from this registration, and a new ticket will be created for them.
                </p>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setExistingCustomer(null);
                    setPendingRequest(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeConfirm}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {processing ? 'Merging...' : 'Merge & Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMassDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: SECONDARY }}>
                Delete Selected Requests
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to permanently delete {selectedIds.size} selected request(s)? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the selected registration requests from the database.
                </p>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowMassDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMassDelete}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {processing ? 'Deleting...' : 'Yes, Delete Selected'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
