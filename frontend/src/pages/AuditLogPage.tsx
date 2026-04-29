import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Loader2, AlertCircle, FileType, ShieldAlert, UserPlus, RefreshCcw, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

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
  const { isGuest, role, user } = useAuth();
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!isGuest) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, [isGuest]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Initiating audit log retrieval...');
      
      let finalLogs: AuditLog[] = [];
      
      // For Admins: Always use Backend API (to see all logs via Service Role)
      // For Users: Use Direct Supabase Fetch first (more reliable, RLS-filtered)
      if (isAdmin) {
        console.log('Role: ADMIN. Using Backend API for global visibility...');
        const response = await api.get('/audit-logs');
        finalLogs = response.data || [];
      } else {
        console.log('Role: USER. Using Direct Supabase Fetch for reliability...');
        const { data, error: sbError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbError) throw sbError;
        finalLogs = data || [];
        
        // If direct fetch is empty, try backend as a fallback
        if (finalLogs.length === 0) {
          console.log('Direct fetch empty, checking backend fallback...');
          const response = await api.get('/audit-logs');
          if (response.data && response.data.length > 0) {
            finalLogs = response.data;
          }
        }
      }
      
      setLogs(finalLogs);
      console.log(`Fetch sequence complete. Retrieved ${finalLogs.length} records.`);
    } catch (err: any) {
      console.error('CRITICAL_FETCH_FAILURE:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch audit logs.';
      setError(errorMessage);
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
    const isLogin = operation === 'LOGIN';
    const isSignup = operation === 'SIGN_UP';
    const isAlert = operation === 'SECURITY_ALERT';
    
    return (
      <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase border ${
        isEncrypt ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
        isDecrypt ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
        isLogin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
        isSignup ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
        isAlert ? 'bg-red-500/10 text-red-400 border-red-500/30' :
        'bg-white/5 text-muted border-sharp'
      }`}>
        {operation}
      </span>
    );
  };

  return (
    <div className="animate-slide-up max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center text-blue-500/40 hover:text-blue-500 mb-10 transition-all group font-bold text-sm tracking-widest uppercase">
        <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Return to Infrastructure
      </Link>

      <div className="border-sharp bg-card p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-600/10 border border-blue-500/20 shadow-xl shadow-blue-500/5">
              <ClipboardList className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black tech-font tracking-tighter uppercase mb-1">Audit_Log_Feed</h1>
              <div className="flex items-center gap-3">
                <p className="text-muted font-bold tracking-tight uppercase text-[10px]">Immutable Cryptographic Operation Records</p>
                {user && (
                  <div className="px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded text-[8px] font-mono text-blue-400/60">
                    ID: {user.id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                try {
                  console.log('Dispatching test audit event to Backend...');
                  await api.post('/audit/log', {
                    action: 'BACKEND_TEST',
                    resource: 'FRONTEND_DIAGNOSTIC'
                  });
                  alert('Backend dispatch sent! Refresh in 5 seconds.');
                } catch (err: any) {
                  alert('Backend dispatch failed: ' + err.message);
                }
              }}
              className="px-4 py-3 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-600/10 text-[9px] font-black transition-all flex items-center gap-2 text-blue-400 uppercase tracking-[0.2em]"
            >
              Test_Backend
            </button>
            <button 
              onClick={async () => {
                try {
                  if (isGuest) {
                    alert('Cannot test direct write as Guest.');
                    return;
                  }
                  const userRes = await supabase.auth.getUser();
                  const currentUid = userRes.data.user?.id;
                  
                  console.log('Attempting direct Supabase insert for UID:', currentUid);
                  
                  const { data, error: sbError } = await supabase
                    .from('audit_logs')
                    .insert({
                      action: 'DIRECT_FRONTEND_TEST',
                      file_name: 'DIAGNOSTIC_RESOURCE',
                      file_size_bytes: 0,
                      user_id: currentUid
                    })
                    .select();
                  
                  if (sbError) throw sbError;
                  
                  const insertedRecord = data && data[0];
                  
                  // Diagnostic: Immediate read-back attempt
                  console.log('Attempting immediate read-back of record:', insertedRecord?.id);
                  const { data: readBack, error: readError } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .eq('id', insertedRecord?.id);
                  
                  const canReadBack = readBack && readBack.length > 0;
                  
                  alert(`Direct Insert SUCCESS!\nRecord ID: ${insertedRecord?.id}\nStored UID: ${insertedRecord?.user_id}\n\nYour current JWT UID: ${currentUid}\n\nImmediate Read-Back Test: ${canReadBack ? 'PASSED (I can see it!)' : 'FAILED (RLS is blocking me!)'}`);
                  
                  if (!canReadBack && readError) {
                    console.error('Read-back error detail:', readError);
                  }
                  
                  fetchLogs();
                } catch (err: any) {
                  alert('Direct insert failed: ' + err.message);
                }
              }}
              className="px-4 py-3 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-600/10 text-[9px] font-black transition-all flex items-center gap-2 text-indigo-400 uppercase tracking-[0.2em]"
            >
              Test_Direct_DB
            </button>
            <button 
              onClick={fetchLogs}
              disabled={isLoading || isGuest}
              className="px-6 py-3 border border-sharp bg-white/5 hover:bg-blue-600/10 text-xs font-bold transition-all flex items-center gap-2 text-muted hover:text-blue-500 uppercase tracking-widest active:scale-95 disabled:opacity-30"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh_Feed
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start text-red-400 animate-slide-up relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <AlertCircle className="w-5 h-5 mr-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div className="flex-1">
              <p className="text-sm font-bold tech-font tracking-tight uppercase mb-1">Retrieval_Failure</p>
              <p className="text-xs font-semibold opacity-80 leading-relaxed">{error}</p>
              <button 
                onClick={fetchLogs}
                className="mt-4 text-[10px] font-black text-red-400 hover:text-white uppercase tracking-widest border border-red-500/30 px-3 py-1 hover:bg-red-500/20 transition-all"
              >
                Retry_Protocol
              </button>
            </div>
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
        ) : !error && logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center border-sharp bg-white/5 text-center">
            <ShieldAlert className="w-16 h-16 text-blue-500/20 mb-6" />
            <h3 className="text-xl font-bold tech-font mb-2 tracking-tight uppercase">Zero Activity Detected</h3>
            <p className="text-muted font-bold uppercase text-[10px]">Your cryptographic audit trail is currently empty.</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-hidden border border-sharp bg-[var(--bg-main)]/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-muted text-[10px] uppercase tracking-[0.2em] font-bold">
                    <th className="p-6">Operation</th>
                    {isAdmin && <th className="p-6">User_Identity</th>}
                    <th className="p-6">Secure_Resource</th>
                    <th className="p-6">Payload_Size</th>
                    <th className="p-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-sharp">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-all group">
                      <td className="p-6 align-middle">
                        {getOperationBadge(log.action)}
                      </td>
                      {isAdmin && (
                        <td className="p-6 align-middle">
                          <span className="text-[10px] font-mono text-blue-400/80 bg-blue-500/5 px-2 py-1 border border-blue-500/10 block max-w-[120px] truncate" title={log.user_id}>
                            {log.user_id || 'ANONYMOUS'}
                          </span>
                        </td>
                      )}
                      <td className="p-6 align-middle">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-600/10 border border-blue-500/20 mr-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileType className="w-4 h-4 text-blue-500 transition-colors" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold tech-font text-sm truncate max-w-[240px] group-hover:text-blue-400 transition-colors" title={log.file_name}>
                              {log.file_name.includes(' [ID: ') ? log.file_name.split(' [ID: ')[0].toUpperCase() : log.file_name.toUpperCase()}
                            </span>
                            {log.file_name.includes(' [ID: ') && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-mono text-blue-500/60 bg-blue-500/5 px-1 border border-blue-500/10">
                                  ID: {log.file_name.split(' [ID: ')[1].replace(']', '')}
                                </span>
                                <button 
                                  onClick={() => {
                                    const id = log.file_name.split(' [ID: ')[1].replace(']', '');
                                    navigator.clipboard.writeText(id);
                                  }}
                                  className="text-[8px] font-black text-blue-500 hover:text-white uppercase transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 align-middle">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest bg-white/5 px-2 py-1 border border-sharp">
                          {formatSize(log.file_size_bytes)}
                        </span>
                      </td>
                      <td className="p-6 align-middle text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold tech-font group-hover:text-blue-400 transition-colors">
                            {formatDate(log.created_at).split(',')[1].trim()}
                          </span>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
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
        ) : null}
      </div>

    </div>
  );
};

export default AuditLogPage;
