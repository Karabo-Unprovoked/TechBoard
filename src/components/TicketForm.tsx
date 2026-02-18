import React, { useState } from 'react';
import { Laptop, FileText, AlertCircle, Hash, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer, RepairTicket } from '../lib/supabase';

interface TicketFormProps {
  customers: Customer[];
  onTicketCreated: (ticket: RepairTicket) => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ customers, onTicketCreated }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    device_type: 'Laptop',
    brand: '',
    model: '',
    serial_number: '',
    issue_description: '',
    device_accessories: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const availableAccessories = [
    'Bag',
    'Charger',
    'Battery',
    'RAM',
    'SSD',
    'HDD',
    'Power Cable',
    'Mouse',
    'Keyboard',
    'Stylus',
    'CD/DVD Drive',
    'Other'
  ];

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower) ||
      customer.customer_number.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  const handleSelectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customer_id: customer.id });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const handleClearCustomer = () => {
    setFormData({ ...formData, customer_id: '' });
    setCustomerSearch('');
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-3);
    return `TK-${dateStr}-${timeStr}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ticketData = {
        ...formData,
        ticket_number: generateTicketNumber(),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('repair_tickets')
        .insert([ticketData])
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      onTicketCreated(data);
      setFormData({
        customer_id: '',
        device_type: 'Laptop',
        brand: '',
        model: '',
        serial_number: '',
        issue_description: '',
        device_accessories: []
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const PRIMARY = '#ffb400';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer *
            </label>

            {!formData.customer_id ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                  style={{ focusRingColor: PRIMARY }}
                  placeholder="Search by name, number, email, or phone..."
                  required
                />

                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {customer.first_name && customer.last_name ? `${customer.first_name} ${customer.last_name}` : customer.name}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{customer.customer_number}</div>
                          <div className="flex flex-wrap gap-x-2">
                            {customer.email && <span>{customer.email}</span>}
                            {customer.phone && <span>{customer.phone}</span>}
                          </div>
                          {customer.gender && <div>Gender: {customer.gender}</div>}
                          {customer.referral_source && <div>Referral: {customer.referral_source}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {selectedCustomer?.first_name && selectedCustomer?.last_name ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : selectedCustomer?.name}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{selectedCustomer?.customer_number}</div>
                    <div className="flex flex-wrap gap-x-2">
                      {selectedCustomer?.email && <span>{selectedCustomer.email}</span>}
                      {selectedCustomer?.phone && <span>{selectedCustomer.phone}</span>}
                    </div>
                    {selectedCustomer?.gender && <div>Gender: {selectedCustomer.gender}</div>}
                    {selectedCustomer?.referral_source && <div>Referral: {selectedCustomer.referral_source}</div>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Clear selection"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Device Type *
            </label>
            <div className="relative">
              <Laptop className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                required
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Phone">Phone</option>
                <option value="Tablet">Tablet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="e.g., Dell, HP, Apple"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="e.g., Inspiron 15, MacBook Pro"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Serial Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="Enter device serial number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Issue Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                value={formData.issue_description}
                onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none resize-none"
                style={{ focusRingColor: PRIMARY }}
                rows={4}
                placeholder="Describe the issue with the device..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Device Came With
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableAccessories.map((accessory) => (
                <label
                  key={accessory}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.device_accessories.includes(accessory)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          device_accessories: [...formData.device_accessories, accessory]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          device_accessories: formData.device_accessories.filter(a => a !== accessory)
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: PRIMARY }}
                  />
                  <span className="text-sm text-gray-700">{accessory}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? 'Creating Ticket...' : 'Create Repair Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};