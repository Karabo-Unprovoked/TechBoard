import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard as Edit3, Save, X, Plus, Mail, FileText, Calendar, DollarSign, AlertTriangle, Clock, User, Laptop, Hash, MessageSquare, Send, Paperclip, Download, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RepairTicket, TicketNote, TicketEmail, Customer, TicketStatus } from '../lib/supabase';
import { loadStatuses as loadStatusesUtil, getSubStatusLabel } from '../lib/statusUtils';

interface TicketManagementProps {
  ticket: RepairTicket;
  onBack: () => void;
  onTicketUpdated: (ticket: RepairTicket) => void;
}

export const TicketManagement: React.FC<TicketManagementProps> = ({ 
  ticket: initialTicket, 
  onBack, 
  onTicketUpdated 
}) => {
  const [ticket, setTicket] = useState<RepairTicket>(initialTicket);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [emails, setEmails] = useState<TicketEmail[]>([]);
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'customer'>('internal');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    type: 'status_update',
    subject: '',
    content: ''
  });

  const [editData, setEditData] = useState({
    device_type: ticket.device_type,
    brand: ticket.brand || '',
    model: ticket.model || '',
    serial_number: ticket.serial_number || '',
    issue_description: ticket.issue_description || '',
    status: ticket.status,
    internal_status: ticket.internal_status || '',
    outsourced_to: ticket.outsourced_to || '',
    pending_customer_action_type: ticket.pending_customer_action_type || '',
    priority: ticket.priority || 'medium',
    estimated_cost: ticket.estimated_cost || 0,
    actual_cost: ticket.actual_cost || 0,
    estimated_completion: ticket.estimated_completion ?
      new Date(ticket.estimated_completion).toISOString().slice(0, 16) : '',
    repair_notes: ticket.repair_notes || ''
  });

  useEffect(() => {
    loadTicketDetails();
    loadStatuses();
  }, [ticket.id]);

  const loadStatuses = async () => {
    try {
      const data = await loadStatusesUtil();
      setStatuses(data);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const loadTicketDetails = async () => {
    try {
      // Load notes
      const { data: notesData } = await supabase
        .from('ticket_notes')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      // Load emails
      const { data: emailsData } = await supabase
        .from('ticket_emails')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('sent_at', { ascending: false });

      setNotes(notesData || []);
      setEmails(emailsData || []);
    } catch (error) {
      console.error('Error loading ticket details:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...editData,
        estimated_completion: editData.estimated_completion ? 
          new Date(editData.estimated_completion).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('repair_tickets')
        .update(updateData)
        .eq('id', ticket.id)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      setTicket(data);
      onTicketUpdated(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('ticket_notes')
        .insert([{
          ticket_id: ticket.id,
          note_type: noteType,
          content: newNote,
          created_by: 'Current User' // In real app, get from auth
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!ticket.customer?.email) {
      alert('Customer email not available');
      return;
    }

    setLoading(true);
    try {
      // Send email using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: ticket.customer.email,
          subject: emailData.subject,
          content: emailData.content,
          ticketNumber: ticket.ticket_number
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Save email record to database
      const { data: emailRecord, error: emailError } = await supabase
        .from('ticket_emails')
        .insert([{
          ticket_id: ticket.id,
          email_type: emailData.type,
          recipient_email: ticket.customer.email,
          subject: emailData.subject,
          content: emailData.content,
          sent_by: 'Current User' // In real app, get from auth
        }])
        .select()
        .single();

      if (emailError) throw emailError;

      setEmails(prev => [emailRecord, ...prev]);
      setShowEmailModal(false);
      setEmailData({ type: 'status_update', subject: '', content: '' });
      
      alert('Email sent successfully to ' + ticket.customer.email);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-indigo-100 text-indigo-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'invoiced': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'unrepairable': return 'bg-red-100 text-red-800';
      case 'pending-customer-action': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

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
              <span>Back to Tickets</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: SECONDARY }}>
                Manage Ticket: {ticket.ticket_number}
              </h1>
              <p className="text-gray-600">Complete ticket management and communication</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: PRIMARY }}
              >
                <Edit3 size={16} />
                <span>Edit Ticket</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      device_type: ticket.device_type,
                      brand: ticket.brand || '',
                      model: ticket.model || '',
                      serial_number: ticket.serial_number || '',
                      issue_description: ticket.issue_description || '',
                      status: ticket.status,
                      priority: ticket.priority || 'medium',
                      estimated_cost: ticket.estimated_cost || 0,
                      actual_cost: ticket.actual_cost || 0,
                      estimated_completion: ticket.estimated_completion ? 
                        new Date(ticket.estimated_completion).toISOString().slice(0, 16) : '',
                      repair_notes: ticket.repair_notes || ''
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Ticket Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status and Priority */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  {isEditing ? (
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      {statuses.length === 0 ? (
                        <>
                          <option value="in-transit">In Transit</option>
                          <option value="received">Received</option>
                          <option value="in-progress">In Progress</option>
                          <option value="invoiced">Invoiced</option>
                          <option value="completed">Completed</option>
                          <option value="unrepairable">Unrepairable</option>
                          <option value="pending-customer-action">Pending Customer Action</option>
                        </>
                      ) : (
                        statuses.map((status) => (
                          <option key={status.id} value={status.status_key}>
                            {status.status_label}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {statuses.find(s => s.status_key === ticket.status)?.status_label || ticket.status.replace('-', ' ').toUpperCase()}
                      </span>
                      {ticket.internal_status && (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {getSubStatusLabel(statuses, ticket.status, ticket.internal_status)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-Status (Internal Status) */}
                {(() => {
                  const currentStatus = statuses.find(s => s.status_key === (isEditing ? editData.status : ticket.status));
                  if (currentStatus?.sub_statuses && currentStatus.sub_statuses.length > 0) {
                    return (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sub-Status</label>
                        {isEditing ? (
                          <select
                            value={editData.internal_status}
                            onChange={(e) => setEditData({ ...editData, internal_status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                            style={{ focusRingColor: PRIMARY }}
                          >
                            <option value="">Select...</option>
                            {currentStatus.sub_statuses.map((subStatus) => (
                              <option key={subStatus.id} value={subStatus.sub_status_key}>
                                {subStatus.sub_status_label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {ticket.internal_status ? getSubStatusLabel(statuses, ticket.status, ticket.internal_status) : 'Not set'}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Outsourced To */}
                {editData.internal_status === 'outsourced' && isEditing && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Outsourced To</label>
                    <input
                      type="text"
                      value={editData.outsourced_to}
                      onChange={(e) => setEditData({ ...editData, outsourced_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Company or person name"
                    />
                  </div>
                )}


                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                  {isEditing ? (
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority || 'medium')}`}>
                      {(ticket.priority || 'medium').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Device Information */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Device Type</label>
                  {isEditing ? (
                    <select
                      value={editData.device_type}
                      onChange={(e) => setEditData({ ...editData, device_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Phone">Phone</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{ticket.device_type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.brand}
                      onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="e.g., Dell, HP, Apple"
                    />
                  ) : (
                    <p className="text-gray-900">{ticket.brand || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Model</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.model}
                      onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="e.g., Inspiron 15, MacBook Pro"
                    />
                  ) : (
                    <p className="text-gray-900">{ticket.model || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Serial Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.serial_number}
                      onChange={(e) => setEditData({ ...editData, serial_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Enter serial number"
                    />
                  ) : (
                    <p className="text-gray-900 font-mono text-sm">{ticket.serial_number || 'Not specified'}</p>
                  )}
                </div>

                {/* Accessories */}
                {ticket.device_accessories && ticket.device_accessories.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Device Came With</label>
                    <div className="flex flex-wrap gap-2">
                      {ticket.device_accessories.map((accessory) => (
                        <span
                          key={accessory}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {accessory}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Information */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Cost</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.estimated_cost}
                      onChange={(e) => setEditData({ ...editData, estimated_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-gray-900">R{ticket.estimated_cost?.toFixed(2) || '0.00'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Actual Cost</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.actual_cost}
                      onChange={(e) => setEditData({ ...editData, actual_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-gray-900">R{ticket.actual_cost?.toFixed(2) || '0.00'}</p>
                  )}
                </div>

                {/* Estimated Completion */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Completion</label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editData.estimated_completion}
                      onChange={(e) => setEditData({ ...editData, estimated_completion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  ) : (
                    <p className="text-gray-900">
                      {ticket.estimated_completion ? formatDate(ticket.estimated_completion) : 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Issue Description */}
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Issue Description</label>
                {isEditing ? (
                  <textarea
                    value={editData.issue_description}
                    onChange={(e) => setEditData({ ...editData, issue_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                    style={{ focusRingColor: PRIMARY }}
                    rows={3}
                    placeholder="Describe the issue..."
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {ticket.issue_description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Repair Notes */}
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Repair Notes</label>
                {isEditing ? (
                  <textarea
                    value={editData.repair_notes}
                    onChange={(e) => setEditData({ ...editData, repair_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                    style={{ focusRingColor: PRIMARY }}
                    rows={3}
                    placeholder="Add repair notes..."
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {ticket.repair_notes || 'No repair notes yet'}
                  </p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Progress Notes
              </h3>
              
              {/* Add New Note */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 mb-3">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'internal' | 'customer')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                    style={{ focusRingColor: PRIMARY }}
                  >
                    <option value="internal">Internal Note</option>
                    <option value="customer">Customer Visible</option>
                  </select>
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                  style={{ focusRingColor: PRIMARY }}
                  rows={3}
                  placeholder="Add a progress note..."
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Plus size={16} />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          note.note_type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {note.note_type === 'customer' ? 'Customer Visible' : 'Internal'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {note.created_by} • {formatDate(note.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-900">{note.content}</p>
                  </div>
                ))}
                
                {notes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No notes added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Customer Information
              </h3>
              
              {ticket.customer ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-medium">{ticket.customer.first_name} {ticket.customer.last_name}</span>
                  </div>
                  {ticket.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{ticket.customer.email}</span>
                    </div>
                  )}
                  {ticket.customer.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{ticket.customer.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No customer information available</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowEmailModal(true)}
                  disabled={!ticket.customer?.email}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail size={18} />
                  <span>Send Email</span>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <FileText size={18} />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>

            {/* Email History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Email History
              </h3>
              
              <div className="space-y-3">
                {emails.map((email) => (
                  <div key={email.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{email.subject}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(email.sent_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">To: {email.recipient_email}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{email.content}</p>
                  </div>
                ))}
                
                {emails.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Mail size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No emails sent yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold" style={{ color: SECONDARY }}>
                  Send Email to Customer
                </h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Type</label>
                  <select
                    value={emailData.type}
                    onChange={(e) => setEmailData({ ...emailData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                    style={{ focusRingColor: PRIMARY }}
                  >
                    <option value="status_update">Status Update</option>
                    <option value="completion_notice">Completion Notice</option>
                    <option value="parts_needed">Parts Needed</option>
                    <option value="quote_request">Quote Request</option>
                    <option value="general">General Communication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                    style={{ focusRingColor: PRIMARY }}
                    placeholder={
                      emailData.type === 'status_update' ? `Repair Update - ${ticket.ticket_number}` :
                      emailData.type === 'completion_notice' ? `Repair Complete - ${ticket.ticket_number}` :
                      emailData.type === 'parts_needed' ? `Parts Required - ${ticket.ticket_number}` :
                      emailData.type === 'quote_request' ? `Repair Quote - ${ticket.ticket_number}` :
                      'Email subject...'
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    value={emailData.content}
                    onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                    style={{ focusRingColor: PRIMARY }}
                    rows={6}
                    placeholder={
                      emailData.type === 'status_update' ? 
                        `Dear ${ticket.customer?.first_name} ${ticket.customer?.last_name},\n\nWe wanted to update you on the status of your ${ticket.device_type} repair.\n\nCurrent Status: ${ticket.status.replace('-', ' ').toUpperCase()}\n\nWe will keep you informed of any further progress.\n\nBest regards,\nGuardian Assist Team` :
                      emailData.type === 'completion_notice' ?
                        `Dear ${ticket.customer?.first_name} ${ticket.customer?.last_name},\n\nGreat news! Your ${ticket.device_type} repair has been completed and is ready for collection.\n\nPlease contact us to arrange pickup at your convenience.\n\nThank you for choosing Guardian Assist!\n\nBest regards,\nGuardian Assist Team` :
                      emailData.type === 'parts_needed' ?
                        `Dear ${ticket.customer?.first_name} ${ticket.customer?.last_name},\n\nWe need to order additional parts for your ${ticket.device_type} repair.\n\nThis may extend the repair time by a few days. We will keep you updated on the progress.\n\nThank you for your patience.\n\nBest regards,\nGuardian Assist Team` :
                      emailData.type === 'quote_request' ?
                        `Dear ${ticket.customer?.first_name} ${ticket.customer?.last_name},\n\nWe have diagnosed your ${ticket.device_type} and prepared a repair quote.\n\nEstimated Cost: R${ticket.estimated_cost?.toFixed(2) || '0.00'}\n\nPlease let us know if you would like to proceed with the repair.\n\nBest regards,\nGuardian Assist Team` :
                      'Email content...'
                    }
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailData.subject || !emailData.content || loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>{loading ? 'Sending...' : 'Send Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};