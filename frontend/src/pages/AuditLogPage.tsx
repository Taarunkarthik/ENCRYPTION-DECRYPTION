import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, AlertCircle, Calendar, FileType, ShieldAlert, UserPlus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  file_name: string;
  file_size_bytes: number;
  created_at: string;
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isGuest } = useAuth();

  useEffect(() => {
    if (!isGuest) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, [isGuest]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/audit-logs');
      setLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOperationBadge = (operation: string) => {
    if (operation.includes('ENCRYPT')) {
      return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-bold border border-blue-500/30">ENCRYPT</span>;
    }
    if (operation.includes('DECRYPT')) {
      return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md text-xs font-bold border border-purple-500/30">DECRYPT</span>;
    }
    return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-md text-xs font-bold border border-gray-500/30">{operation}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center">
      <div className="max-w-5xl w-full">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-3 bg-gray-500/20 rounded-xl mr-4 border border-gray-600/30">
                <ClipboardList className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Audit Logs</h1>
                <p className="text-gray-400">Review your security operations and activities</p>
              </div>
            </div>
            <button 
              onClick={fetchLogs}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors flex items-center"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start text-red-400">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p>Loading audit logs...</p>
            </div>
          ) : isGuest ? (
            <div className="py-16 flex flex-col items-center justify-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
              <UserPlus className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-200 mb-2">Activity Tracking Unavailable</h3>
              <p className="text-gray-400 max-w-md text-center mb-6">
                Guest mode does not track activity. Sign up for a free account to maintain a secure audit trail of all your encryption and decryption operations.
              </p>
              <Link 
                to="/signup" 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Create Free Account
              </Link>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
              <ShieldAlert className="w-12 h-12 text-gray-500 mb-3" />
              <h3 className="text-xl font-bold text-gray-400 mb-1">No Activity Found</h3>
              <p className="text-gray-500">You haven't performed any encryption or decryption operations yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-700 text-gray-400 text-sm">
                    <th className="p-4 font-semibold">Operation</th>
                    <th className="p-4 font-semibold">File Details</th>
                    <th className="p-4 font-semibold">Size</th>
                    <th className="p-4 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-750 transition-colors bg-gray-800">
                      <td className="p-4 align-middle">
                        {getOperationBadge(log.action)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <FileType className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="font-medium text-gray-200 truncate max-w-[200px]" title={log.file_name}>
                            {log.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-gray-400 text-sm">
                        {formatSize(log.file_size_bytes)}
                      </td>
                      <td className="p-4 align-middle text-right text-gray-400 text-sm">
                        <div className="flex items-center justify-end">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
