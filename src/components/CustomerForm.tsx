import React, { useState } from 'react';
import { User, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../lib/supabase';

interface CustomerFormProps {
  onCustomerCreated: (customer: Customer) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    referral_source: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('');

    try {
      if (formData.email) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', formData.email)
          .maybeSingle();

        if (existingCustomer) {
          const customerData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            name: `${formData.first_name} ${formData.last_name}`.trim(),
            phone: formData.phone || existingCustomer.phone,
            gender: formData.gender || existingCustomer.gender,
            referral_source: formData.referral_source || existingCustomer.referral_source
          };

          const { data, error } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', existingCustomer.id)
            .select()
            .single();

          if (error) throw error;

          setSuccessMessage(`Customer with email ${formData.email} already exists. Information updated.`);
          onCustomerCreated(data);
          setFormData({ first_name: '', last_name: '', name: '', email: '', phone: '', gender: '', referral_source: '' });
          return;
        }
      }

      const customerNumber = await generateCustomerNumber();

      const customerData = {
        ...formData,
        name: `${formData.first_name} ${formData.last_name}`.trim() || formData.name,
        customer_number: customerNumber
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      onCustomerCreated(data);
      setFormData({ first_name: '', last_name: '', name: '', email: '', phone: '', gender: '', referral_source: '' });

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                  style={{ focusRingColor: PRIMARY }}
                  placeholder="First name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                  style={{ focusRingColor: PRIMARY }}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Referral Source
              </label>
              <select
                value={formData.referral_source}
                onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ focusRingColor: PRIMARY }}
              >
                <option value="">Select referral source</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="Word of Mouth">Word of Mouth</option>
                <option value="Google">Google</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm">{successMessage}</span>
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