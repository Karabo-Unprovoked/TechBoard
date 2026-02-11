import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, RotateCcw, X, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NotificationType } from './Notification';

interface DeletedCustomer {
  id: string;
  customer_id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  referral_source: string | null;
  original_created_at: string;
  deleted_at: string;
  tickets_data: any[];
  auto_delete_at: string;
}

interface RecycleBinProps {
  onClose: () => void;
  onRefresh: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

export const RecycleBin: React.FC<RecycleBinProps> = ({ onClose, onRefresh, onNotification }) => {
  const [deletedCustomers, setDeletedCustomers] = useState<DeletedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDeletedCustomers();
  }, []);

  const loadDeletedCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_customers')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedCustomers(data || []);
    } catch (error: any) {
      onNotification('error', 'Failed to load recycle bin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (deletedCustomer: DeletedCustomer) => {
    setRestoring(true);
    try {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('customer_number')
        .eq('customer_number', deletedCustomer.customer_number)
        .maybeSingle();

      if (existingCustomer) {
        onNotification('error', 'A customer with this number already exists. Cannot restore.');
        return;
      }

      const { data: restoredCustomer, error: restoreError } = await supabase
        .from('customers')
        .insert({
          id: deletedCustomer.customer_id,
          customer_number: deletedCustomer.customer_number,
          first_name: deletedCustomer.first_name,
          last_name: deletedCustomer.last_name,
          name: deletedCustomer.name,
          email: deletedCustomer.email,
          phone: deletedCustomer.phone,
          gender: deletedCustomer.gender,
          referral_source: deletedCustomer.referral_source,
          created_at: deletedCustomer.original_created_at
        })
        .select()
        .single();

      if (restoreError) throw restoreError;

      if (deletedCustomer.tickets_data && deletedCustomer.tickets_data.length > 0) {
        const ticketsToRestore = deletedCustomer.tickets_data.map((ticket: any) => ({
          id: ticket.id,
          customer_id: deletedCustomer.customer_id,
          ticket_number: ticket.ticket_number,
          device_type: ticket.device_type,
          brand: ticket.brand,
          model: ticket.model,
          serial_number: ticket.serial_number,
          issue_description: ticket.issue_description,
          device_accessories: ticket.device_accessories,
          status: ticket.status,
          created_at: ticket.created_at
        }));

        const { error: ticketsError } = await supabase
          .from('repair_tickets')
          .insert(ticketsToRestore);

        if (ticketsError) {
          console.error('Error restoring tickets:', ticketsError);
        }
      }

      await supabase.from('deleted_customers').delete().eq('id', deletedCustomer.id);

      onNotification('success', 'Customer restored successfully!');
      loadDeletedCustomers();
      onRefresh();
    } catch (error: any) {
      onNotification('error', 'Failed to restore customer: ' + error.message);
    } finally {
      setRestoring(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this customer? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('deleted_customers').delete().eq('id', id);

      if (error) throw error;

      onNotification('success', 'Customer permanently deleted');
      setSelectedCustomers(selectedCustomers.filter(sid => sid !== id));
      loadDeletedCustomers();
    } catch (error: any) {
      onNotification('error', 'Failed to delete: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) {
      onNotification('error', 'No customers selected');
      return;
    }

    if (!confirm(`Permanently delete ${selectedCustomers.length} selected customer(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('deleted_customers')
        .delete()
        .in('id', selectedCustomers);

      if (error) throw error;

      onNotification('success', `${selectedCustomers.length} customer(s) permanently deleted`);
      setSelectedCustomers([]);
      loadDeletedCustomers();
    } catch (error: any) {
      onNotification('error', 'Failed to delete customers: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEmptyRecycleBin = async () => {
    if (deletedCustomers.length === 0) {
      onNotification('error', 'Recycle bin is already empty');
      return;
    }

    if (!confirm(`⚠️ WARNING: This will permanently delete ALL ${deletedCustomers.length} customer(s) in the recycle bin. This action cannot be undone. Are you sure?`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('deleted_customers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      onNotification('success', 'Recycle bin emptied successfully');
      setSelectedCustomers([]);
      loadDeletedCustomers();
    } catch (error: any) {
      onNotification('error', 'Failed to empty recycle bin: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === deletedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(deletedCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(sid => sid !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
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

  const getDaysRemaining = (autoDeleteDate: string) => {
    const now = new Date();
    const deleteDate = new Date(autoDeleteDate);
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Trash2 className="text-gray-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Recycle Bin</h3>
                <p className="text-sm text-gray-600">
                  {deletedCustomers.length} deleted customer{deletedCustomers.length !== 1 ? 's' : ''}
                  {selectedCustomers.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedCustomers.length} selected)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadDeletedCustomers}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {deletedCustomers.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === deletedCustomers.length && deletedCustomers.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>

              {selectedCustomers.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span>Delete Selected ({selectedCustomers.length})</span>
                </button>
              )}

              <button
                onClick={handleEmptyRecycleBin}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 ml-auto"
              >
                <Trash2 size={16} />
                <span>Empty Recycle Bin</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : deletedCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recycle bin is empty</h3>
              <p className="text-gray-600">Deleted customers will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedCustomers.map((customer) => {
                const daysRemaining = getDaysRemaining(customer.auto_delete_at);
                const isSelected = selectedCustomers.includes(customer.id);
                return (
                  <div
                    key={customer.id}
                    className={`bg-gray-50 border rounded-xl p-5 hover:shadow-md transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectCustomer(customer.id)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{customer.customer_number}</h4>
                          <span className="text-sm text-gray-600">
                            {customer.first_name} {customer.last_name}
                          </span>
                        </div>
                        {customer.email && (
                          <p className="text-sm text-gray-600 mb-1">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-gray-600 mb-1">{customer.phone}</p>
                        )}
                        {customer.tickets_data && customer.tickets_data.length > 0 && (
                          <p className="text-sm text-blue-600 mt-2">
                            {customer.tickets_data.length} ticket{customer.tickets_data.length !== 1 ? 's' : ''} will be restored
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleRestore(customer)}
                          disabled={restoring || deleting}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={16} />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(customer.id)}
                          disabled={deleting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          <X size={16} />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Deleted {formatDate(customer.deleted_at)}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          daysRemaining <= 7 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        Auto-deletes in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
