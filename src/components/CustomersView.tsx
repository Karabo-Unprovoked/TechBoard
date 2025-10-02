import React from 'react';
import { Eye, RefreshCw, Calendar, User, Mail, Phone, FileText, Settings } from 'lucide-react';
import type { Customer } from '../lib/supabase';

interface CustomersViewProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onRefresh: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ 
  customers, 
  onViewCustomer,
  onRefresh
}) => {
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

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {customers.length} Customer{customers.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-600">Manage customer information and view repair history</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">Add a new customer to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              {/* Customer Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{customer.customer_number}</h4>
                  <p className="text-sm text-gray-600">{customer.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewCustomer(customer)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: PRIMARY }}
                    title="View Customer Details"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              {customer.email && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Mail size={16} />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Phone size={16} />
                  <span>{customer.phone}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                <Calendar size={14} />
                <span>Added {formatDate(customer.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};