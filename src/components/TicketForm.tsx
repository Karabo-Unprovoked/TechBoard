import React, { useState } from 'react';
import { Laptop, FileText, AlertCircle, Hash } from 'lucide-react';
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
        status: 'received'
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
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer *
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
              style={{ focusRingColor: PRIMARY }}
              required
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_number} - {customer.first_name} {customer.last_name} {customer.email && `(${customer.email})`}
                </option>
              ))}
            </select>
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