import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Trash2, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { getErrorLogs, clearOldErrorLogs, deleteErrorLog, deleteErrorLogs, clearAllErrorLogs } from '../lib/errorLogger';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_details: Record<string, any>;
  user_email: string | null;
  source: string;
  created_at: string;
}

export const ErrorLogsTab: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadErrorLogs();
  }, []);

  const loadErrorLogs = async () => {
    setLoading(true);
    try {
      const logs = await getErrorLogs(200);
      setErrorLogs(logs);
    } catch (error: any) {
      console.error('Error loading error logs:', error);
      showNotification('error', 'Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Are you sure you want to delete error logs older than 30 days?')) {
      return;
    }

    try {
      await clearOldErrorLogs(30);
      showNotification('success', 'Old error logs cleared successfully');
      setSelectedLogs([]);
      loadErrorLogs();
    } catch (error: any) {
      console.error('Error clearing old logs:', error);
      showNotification('error', 'Failed to clear old logs');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.length === 0) {
      showNotification('error', 'No logs selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedLogs.length} selected log(s)?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteErrorLogs(selectedLogs);
      showNotification('success', `Successfully deleted ${selectedLogs.length} log(s)`);
      setSelectedLogs([]);
      loadErrorLogs();
    } catch (error: any) {
      console.error('Error deleting logs:', error);
      showNotification('error', 'Failed to delete logs');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteErrorLog(logId);
      showNotification('success', 'Log deleted successfully');
      setSelectedLogs(selectedLogs.filter(id => id !== logId));
      loadErrorLogs();
    } catch (error: any) {
      console.error('Error deleting log:', error);
      showNotification('error', 'Failed to delete log');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL error logs. This action cannot be undone. Are you sure?')) {
      return;
    }

    setDeleting(true);
    try {
      await clearAllErrorLogs();
      showNotification('success', 'All error logs cleared successfully');
      setSelectedLogs([]);
      loadErrorLogs();
    } catch (error: any) {
      console.error('Error clearing all logs:', error);
      showNotification('error', 'Failed to clear all logs');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === filteredLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(filteredLogs.map(log => log.id));
    }
  };

  const handleSelectLog = (logId: string) => {
    if (selectedLogs.includes(logId)) {
      setSelectedLogs(selectedLogs.filter(id => id !== logId));
    } else {
      setSelectedLogs([...selectedLogs, logId]);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getErrorTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'smtp':
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'database':
      case 'db':
        return 'bg-red-100 text-red-800';
      case 'validation':
        return 'bg-yellow-100 text-yellow-800';
      case 'authentication':
      case 'auth':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueErrorTypes = ['all', ...Array.from(new Set(errorLogs.map(log => log.error_type)))];

  const filteredLogs = filterType === 'all'
    ? errorLogs
    : errorLogs.filter(log => log.error_type === filterType);

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Error Logs</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage system error logs
            {selectedLogs.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedLogs.length} selected)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadErrorLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedLogs.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedLogs.length})
            </button>
          )}
          <button
            onClick={handleClearOldLogs}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear Old Logs
          </button>
          <button
            onClick={handleClearAllLogs}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uniqueErrorTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <span className="ml-auto text-sm text-gray-600">
            Showing {filteredLogs.length} of {errorLogs.length} logs
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No error logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getErrorTypeColor(
                            log.error_type
                          )}`}
                        >
                          {log.error_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.source}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                        {log.error_message}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.user_email || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleExpandRow(log.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            {expandedRow === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deleting}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete log"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                Full Error Message:
                              </h4>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {log.error_message}
                              </p>
                            </div>
                            {log.error_details && Object.keys(log.error_details).length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                  Error Details:
                                </h4>
                                <pre className="text-xs text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                                  {JSON.stringify(log.error_details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
