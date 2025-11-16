import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard as Edit3, Save, X, User, Mail, Phone, Calendar, Wrench, Eye, Hash, Users, MapPin, MessageCircle, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface CustomerManagementProps {
  customer: Customer;
  onBack: () => void;
  onCustomerUpdated: (customer: Customer) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ 
  customer: initialCustomer, 
  onBack, 
  onCustomerUpdated 
}) => {
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerTickets, setCustomerTickets] = useState<RepairTicket[]>([]);

  const [editData, setEditData] = useState({
    title: customer.title || '',
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email || '',
    phone: customer.phone || '',
    gender: customer.gender || '',
    referral_source: customer.referral_source || '',
    preferred_contact_method: customer.preferred_contact_method || 'email',
    needs_collection: customer.needs_collection || false,
    street_address: customer.street_address || '',
    address_line_2: customer.address_line_2|| '',
    city: customer.city || '',
    province: customer.province || '',
    postal_code: customer.postal_code || '',
    country: customer.country || 'South Africa'
  });

  useEffect(() => {
    loadCustomerTickets();
  }, [customer.id]);

  const loadCustomerTickets = async () => {
    try {
      const { data: ticketsData } = await supabase
        .from('repair_tickets')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      setCustomerTickets(ticketsData || []);
    } catch (error) {
      console.error('Error loading customer tickets:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(editData)
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;

      setCustomer(data);
      onCustomerUpdated(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'waiting-parts': return 'bg-orange-100 text-orange-800';
      case 'unrepairable': return 'bg-red-100 text-red-800';
      case 'pending-customer-action': return 'bg-purple-100 text-purple-800';
      case 'void': return 'bg-gray-400 text-white';
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
              <span>Back to Customers</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: SECONDARY }}>
                Customer: {customer.customer_number}
              </h1>
              <p className="text-gray-600">View customer details and repair history</p>
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
                <span>Edit Customer</span>
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
                      title: customer.title || '',
                      first_name: customer.first_name,
                      last_name: customer.last_name,
                      email: customer.email || '',
                      phone: customer.phone || '',
                      gender: customer.gender || '',
                      referral_source: customer.referral_source || '',
                      preferred_contact_method: customer.preferred_contact_method || 'email',
                      needs_collection: customer.needs_collection || false,
                      street_address: customer.street_address || '',
                      address_line_2: customer.address_line_2 || '',
                      city: customer.city || '',
                      province: customer.province || '',
                      postal_code: customer.postal_code || '',
                      country: customer.country || 'South Africa'
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
          {/* Customer Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Customer Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Customer Number</label>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-gray-400" />
                    <span className="font-mono text-lg font-bold" style={{ color: PRIMARY }}>
                      {customer.customer_number}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                  {isEditing ? (
                    <select
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.title || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.first_name}
                      onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.first_name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.last_name}
                      onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.last_name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.email || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                  {isEditing ? (
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.gender || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Contact Method</label>
                  {isEditing ? (
                    <select
                      value={editData.preferred_contact_method}
                      onChange={(e) => setEditData({ ...editData, preferred_contact_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.preferred_contact_method || 'email'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">How did you hear about us?</label>
                  {isEditing ? (
                    <select
                      value={editData.referral_source}
                      onChange={(e) => setEditData({ ...editData, referral_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select source</option>
                      <option value="google">Google Search</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="friend">Friend/Family</option>
                      <option value="repeat">Repeat Customer</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-gray-900">{customer.referral_source || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editData.needs_collection}
                        onChange={(e) => setEditData({ ...editData, needs_collection: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: PRIMARY }}
                      />
                    ) : (
                      <Truck size={16} className="text-gray-400" />
                    )}
                    <div>
                      <span className="text-sm font-bold text-gray-700">Collection & Delivery Service</span>
                      {!isEditing && (
                        <p className="text-sm text-gray-600">{customer.needs_collection ? 'Yes - Requested' : 'No'}</p>
                      )}
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Customer Since</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-900">{formatDate(customer.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: SECONDARY }}>
                <MapPin size={20} />
                Address Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.street_address}
                      onChange={(e) => setEditData({ ...editData, street_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Street address"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.street_address || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Address Line 2</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.address_line_2}
                      onChange={(e) => setEditData({ ...editData, address_line_2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Apt, suite, etc."
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.address_line_2 || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="City"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.city || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Province</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.province}
                      onChange={(e) => setEditData({ ...editData, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Province"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.province || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.postal_code}
                      onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Postal code"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.postal_code || 'Not provided'}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                      placeholder="Country"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{customer.country || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: SECONDARY }}>
                Customer Statistics
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tickets</span>
                  <span className="font-semibold">{customerTickets.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Repairs</span>
                  <span className="font-semibold text-green-600">
                    {customerTickets.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Tickets</span>
                  <span className="font-semibold text-blue-600">
                    {customerTickets.filter(t => !['completed', 'unrepairable'].includes(t.status)).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Repair History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: SECONDARY }}>
                  Repair History
                </h3>
                {customerTickets.length > 0 && (
                  <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                    {customerTickets.length} ticket{customerTickets.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              
              {customerTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Wrench size={48} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No repair history</h4>
                  <p className="text-gray-600">This customer hasn't had any repairs yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{ticket.ticket_number}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-bold text-gray-700">Device:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {ticket.device_type}
                            {(ticket.brand || ticket.model) && (
                              <span className="text-gray-500">
                                {' '}• {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {ticket.estimated_cost > 0 && (
                          <div>
                            <span className="text-sm font-bold text-gray-700">Cost:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              R{ticket.estimated_cost.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {ticket.issue_description && (
                        <div>
                          <span className="text-sm font-bold text-gray-700">Issue:</span>
                          <p className="text-sm text-gray-600 mt-1">{ticket.issue_description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};