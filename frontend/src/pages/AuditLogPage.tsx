import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, AlertCircle, FileType, ShieldAlert, UserPlus, RefreshCcw, ArrowRight } from 'lucide-react';
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
      minute: '2-digit'
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
    const isEncrypt = operation.includes('ENCRYPT');
    const isDecrypt = operation.includes('DECRYPT');
    
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
        isEncrypt ? 'bg-blue-100 text-blue-600 border-blue-200' : 
        isDecrypt ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 
        'bg-blue-50 text-blue-900/40 border-blue-100'
      }`}>
        {operation}
      </span>
    );
  };

  return (
    <div className="animate-slide-up max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center text-blue-900/40 hover:text-blue-600 mb-10 transition-all group font-bold text-sm tracking-widest uppercase">
        <div className="p-2 bg-blue-50 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors border border-blue-100">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Return to Infrastructure
      </Link>

      <div className="glass rounded-[2.5rem] p-8 sm:p-12 border-blue-100 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-100 rounded-3xl border border-blue-200 shadow-xl shadow-blue-500/5">
              <ClipboardList className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-blue-950 mb-1">View My Audit Log</h1>
              <p className="text-blue-900/40 font-bold tracking-tight uppercase text-xs">Immutable Cryptographic Operation Records</p>
            </div>
          </div>
          <button 
            onClick={fetchLogs}
            disabled={isLoading || isGuest}
            className="px-6 py-3 bg-blue-50 hover:bg-blue-100 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-blue-100 text-blue-900 uppercase tracking-widest active:scale-95 disabled:opacity-30"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>

        {error && (
          <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start text-red-400 animate-slide-up">
            <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-12 h-12 animate-spin mb-6 text-blue-400 relative z-10" />
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Retrieving secure records...</p>
          </div>
        ) : isGuest ? (
          <div className="py-20 flex flex-col items-center justify-center glass rounded-[3rem] border-blue-100 text-center px-6">
            <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-200 shadow-2xl shadow-blue-600/5">
              <UserPlus className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-950 mb-4">Activity Tracking Offline</h3>
            <p className="text-blue-900/60 max-w-sm mb-10 font-bold leading-relaxed">
              Guest sessions are ephemeral and do not maintain audit trails. Initialize a secure profile to enable immutable activity logging.
            </p>
            <Link 
              to="/signup" 
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group active:scale-95"
            >
              Initialize Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center glass rounded-[3rem] border-blue-100 text-center">
            <ShieldAlert className="w-16 h-16 text-blue-200 mb-6" />
            <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-tight">Zero Activity Detected</h3>
            <p className="text-blue-900/40 font-bold uppercase text-xs">Your cryptographic audit trail is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-blue-50/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 text-blue-900/40 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <th className="p-6">Operation</th>
                    <th className="p-6">Secure Resource</th>
                    <th className="p-6">Payload</th>
                    <th className="p-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white transition-all group">
                      <td className="p-6 align-middle">
                        {getOperationBadge(log.action)}
                      </td>
                      <td className="p-6 align-middle">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors border border-blue-50">
                            <FileType className="w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <span className="font-bold text-blue-900/80 truncate max-w-[240px] group-hover:text-blue-600 transition-colors" title={log.file_name}>
                            {log.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 align-middle">
                        <span className="text-[10px] font-bold text-blue-900/40 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded border border-blue-100">
                          {formatSize(log.file_size_bytes)}
                        </span>
                      </td>
                      <td className="p-6 align-middle text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
                            {formatDate(log.created_at).split(',')[1]}
                          </span>
                          <span className="text-[10px] font-bold text-blue-900/40 uppercase tracking-widest">
                            {formatDate(log.created_at).split(',')[0]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
