import React, { useState } from 'react';
import { Eye, RefreshCw, Calendar, User, Mail, Phone, FileText, Settings, Search, Trash2, LayoutGrid, List, Download, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../lib/supabase';
import { AdminPasswordModal } from './AdminPasswordModal';
import type { NotificationType } from './Notification';
import { exportCustomersToExcel } from '../lib/exportUtils';
import { CustomerImport } from './CustomerImport';

interface CustomersViewProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onRefresh: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onViewCustomer,
  onRefresh,
  onNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'customer_number'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pendingDeleteCustomerId, setPendingDeleteCustomerId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [massDeleteStep, setMassDeleteStep] = useState<'confirm' | 'admin'>('confirm');
  const [customersRequiringAdmin, setCustomersRequiringAdmin] = useState<string[]>([]);

  const handleDeleteClick = async (customerId: string) => {
    const { data: tickets } = await supabase
      .from('repair_tickets')
      .select('*')
      .eq('customer_id', customerId);

    if (tickets && tickets.length > 0) {
      const hasActiveTickets = tickets.some(
        (t) => !['completed', 'cancelled'].includes(t.status)
      );

      if (hasActiveTickets) {
        onNotification(
          'warning',
          'Cannot delete customer with active tickets. Only customers with completed or no tickets can be deleted.'
        );
        setDeleteConfirm(null);
        return;
      }

      setPendingDeleteCustomerId(customerId);
      setShowAdminModal(true);
      setDeleteConfirm(null);
    } else {
      await deleteCustomer(customerId);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    setDeleting(true);
    try {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error('Customer not found');

      const { data: tickets } = await supabase
        .from('repair_tickets')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['completed', 'cancelled']);

      const { data: session } = await supabase.auth.getSession();

      await supabase.from('deleted_customers').insert({
        customer_id: customer.id,
        customer_number: customer.customer_number,
        first_name: customer.first_name,
        last_name: customer.last_name,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gender: customer.gender,
        referral_source: customer.referral_source,
        original_created_at: customer.created_at,
        deleted_by: session?.session?.user?.id,
        tickets_data: tickets || []
      });

      if (tickets && tickets.length > 0) {
        await supabase
          .from('repair_tickets')
          .delete()
          .eq('customer_id', customerId);
      }

      await supabase.from('customers').delete().eq('id', customerId);

      onNotification('success', 'Customer moved to recycle bin. Can be restored within 30 days.');
      onRefresh();
      setDeleteConfirm(null);
    } catch (error: any) {
      onNotification('error', 'Failed to delete customer: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAdminConfirm = async (password: string) => {
    try {
      const { data: setting, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_password')
        .maybeSingle();

      if (error) throw error;

      const adminPassword = setting?.setting_value || 'admin123';

      if (password !== adminPassword) {
        onNotification('error', 'Incorrect admin password');
        return;
      }

      setShowAdminModal(false);
      if (pendingDeleteCustomerId) {
        await deleteCustomer(pendingDeleteCustomerId);
        setPendingDeleteCustomerId(null);
      }
    } catch (error: any) {
      onNotification('error', 'Failed to verify password: ' + error.message);
    }
  };

  const toggleSelectCustomer = (id: string) => {
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
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleMassDeleteClick = async () => {
    if (selectedIds.size === 0) return;

    const customersWithCompletedTickets: string[] = [];

    for (const customerId of Array.from(selectedIds)) {
      const { data: tickets } = await supabase
        .from('repair_tickets')
        .select('*')
        .eq('customer_id', customerId);

      if (tickets && tickets.length > 0) {
        const hasActiveTickets = tickets.some(
          (t) => !['completed', 'cancelled'].includes(t.status)
        );

        if (hasActiveTickets) {
          const customer = customers.find(c => c.id === customerId);
          onNotification(
            'warning',
            `Cannot delete ${customer?.name || 'customer'} - has active tickets`
          );
          setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(customerId);
            return newSet;
          });
          continue;
        }

        const hasCompletedTickets = tickets.some(
          (t) => ['completed', 'cancelled'].includes(t.status)
        );

        if (hasCompletedTickets) {
          customersWithCompletedTickets.push(customerId);
        }
      }
    }

    setCustomersRequiringAdmin(customersWithCompletedTickets);
    setMassDeleteStep('confirm');
    setShowMassDeleteModal(true);
  };

  const handleMassDeleteConfirm = async () => {
    if (customersRequiringAdmin.length > 0) {
      setMassDeleteStep('admin');
    } else {
      await executeMassDelete();
    }
  };

  const handleMassDeleteAdminConfirm = async (password: string) => {
    try {
      const { data: setting, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_password')
        .maybeSingle();

      if (error) throw error;

      const adminPassword = setting?.setting_value || 'admin123';

      if (password !== adminPassword) {
        onNotification('error', 'Incorrect admin password');
        return;
      }

      await executeMassDelete();
    } catch (error: any) {
      onNotification('error', 'Failed to verify password: ' + error.message);
    }
  };

  const executeMassDelete = async () => {
    setDeleting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      let successCount = 0;

      for (const customerId of Array.from(selectedIds)) {
        const customer = customers.find((c) => c.id === customerId);
        if (!customer) continue;

        const { data: tickets } = await supabase
          .from('repair_tickets')
          .select('*')
          .eq('customer_id', customerId)
          .in('status', ['completed', 'cancelled']);

        await supabase.from('deleted_customers').insert({
          customer_id: customer.id,
          customer_number: customer.customer_number,
          first_name: customer.first_name,
          last_name: customer.last_name,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          gender: customer.gender,
          referral_source: customer.referral_source,
          original_created_at: customer.created_at,
          deleted_by: session?.session?.user?.id,
          tickets_data: tickets || []
        });

        if (tickets && tickets.length > 0) {
          await supabase
            .from('repair_tickets')
            .delete()
            .eq('customer_id', customerId);
        }

        await supabase.from('customers').delete().eq('id', customerId);
        successCount++;
      }

      onNotification('success', `${successCount} customer(s) moved to recycle bin. Can be restored within 30 days.`);
      setSelectedIds(new Set());
      setShowMassDeleteModal(false);
      setMassDeleteStep('confirm');
      setCustomersRequiringAdmin([]);
      onRefresh();
    } catch (error: any) {
      onNotification('error', 'Failed to delete customers: ' + error.message);
    } finally {
      setDeleting(false);
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

  const filteredCustomers = customers
    .filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.customer_number.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'customer_number') {
        // Extract numeric part for proper numerical sorting
        const numA = parseInt(a.customer_number.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.customer_number.replace(/\D/g, '')) || 0;
        return numA - numB;
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const PRIMARY = '#5d5d5d';

  return (
    <div className="space-y-6">
      {/* Header with search, filter, and view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-600">Manage customer information and view repair history</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-gray-900' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="List View"
            >
              <List size={16} className={viewMode === 'list' ? 'text-gray-900' : 'text-gray-600'} />
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Import from Excel"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>

          <button
            onClick={() => exportCustomersToExcel(filteredCustomers)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Export to Excel"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, number, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
            style={{ focusRingColor: PRIMARY }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'customer_number')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
          style={{ focusRingColor: PRIMARY }}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="customer_number">Sort by Number</option>
        </select>
      </div>

      {/* Mass Selection Controls */}
      {filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
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
              onClick={handleMassDeleteClick}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>Delete Selected</span>
            </button>
          )}
        </div>
      )}

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Add a new customer to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              {/* Customer Header */}
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(customer.id)}
                  onChange={() => toggleSelectCustomer(customer.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 focus:ring-2 cursor-pointer flex-shrink-0"
                  style={{ accentColor: PRIMARY }}
                />
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <h4 className="font-semibold text-gray-900">{customer.customer_number}</h4>
                    <p className="text-sm text-gray-600">{customer.first_name} {customer.last_name}</p>
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
                  {deleteConfirm === customer.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteClick(customer.id)}
                        disabled={deleting}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={deleting}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(customer.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                      title="Delete Customer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
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

              {/* Additional Info */}
              {(customer.gender || customer.referral_source) && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {customer.gender && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Gender:</span>
                      <span className="text-gray-700 font-medium">{customer.gender}</span>
                    </div>
                  )}
                  {customer.referral_source && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Referral:</span>
                      <span className="text-gray-700 font-medium">{customer.referral_source}</span>
                    </div>
                  )}
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-6 py-3"></th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Referral</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelectCustomer(customer.id)}
                      className="w-5 h-5 rounded border-gray-300 focus:ring-2 cursor-pointer"
                      style={{ accentColor: PRIMARY }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{customer.customer_number}</div>
                    <div className="text-sm text-gray-600">{customer.first_name} {customer.last_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.email && (
                      <div className="text-sm text-gray-900 truncate max-w-xs">{customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.phone && (
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.gender && (
                      <div className="text-sm text-gray-900">{customer.gender}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.referral_source && (
                      <div className="text-sm text-gray-900">{customer.referral_source}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatDate(customer.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewCustomer(customer)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: PRIMARY }}
                        title="View Customer Details"
                      >
                        <Eye size={18} />
                      </button>
                      {deleteConfirm === customer.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteClick(customer.id)}
                            disabled={deleting}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(customer.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                          title="Delete Customer"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPasswordModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setPendingDeleteCustomerId(null);
        }}
        onConfirm={handleAdminConfirm}
        title="Admin Authorization Required"
        message="This customer has completed tickets. Admin password is required to proceed with deletion."
      />

      {showImportModal && (
        <CustomerImport
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            onRefresh();
          }}
          onNotification={onNotification}
        />
      )}

      {showMassDeleteModal && massDeleteStep === 'confirm' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Delete Selected Customers
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to delete {selectedIds.size} customer(s). They will be moved to the recycle bin and can be restored within 30 days.
            </p>
            {customersRequiringAdmin.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {customersRequiringAdmin.length} customer(s) have completed tickets and will require admin password confirmation.
                </p>
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will also delete all completed tickets associated with these customers.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowMassDeleteModal(false);
                  setMassDeleteStep('confirm');
                  setCustomersRequiringAdmin([]);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMassDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMassDeleteModal && massDeleteStep === 'admin' && (
        <AdminPasswordModal
          isOpen={true}
          onClose={() => {
            setShowMassDeleteModal(false);
            setMassDeleteStep('confirm');
            setCustomersRequiringAdmin([]);
          }}
          onConfirm={handleMassDeleteAdminConfirm}
          title="Admin Authorization Required"
          message="Some customers have completed tickets. Admin password is required to proceed with mass deletion."
        />
      )}
    </div>
  );
};