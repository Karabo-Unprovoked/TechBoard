import React, { useState } from 'react';
import { User, Mail, Phone, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../lib/supabase';

interface CustomerFormProps {
  onCustomerCreated: (customer: Customer) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextCustomerNumber, setNextCustomerNumber] = useState('');

  const generateCustomerNumber = async () => {
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const nextNumber = (count || 0) + 1;
    return `CG${nextNumber.toString().padStart(3, '0')}`;
  };

  React.useEffect(() => {
    generateCustomerNumber().then(setNextCustomerNumber);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const customerNumber = await generateCustomerNumber();
      
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...formData, customer_number: customerNumber }])
        .select()
        .single();

      if (error) throw error;

      onCustomerCreated(data);
      setFormData({ name: '', email: '', phone: '' });

      const newCustomerNumber = await generateCustomerNumber();
      setNextCustomerNumber(newCustomerNumber);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const PRIMARY = '#ffb400';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {nextCustomerNumber && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">
              Next Customer Number: <span className="text-lg font-bold text-blue-800">{nextCustomerNumber}</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Customer Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="Enter customer name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
                placeholder="Enter phone number"
              />
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
            {loading ? 'Creating Customer...' : 'Create Customer'}
          </button>
        </form>
      </div>
    </div>
  );
};