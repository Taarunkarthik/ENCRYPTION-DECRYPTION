import { useEffect, useState } from 'react';
import { 
  Activity, 
  Search, 
  Download, 
  User as UserIcon,
  FileText,
  Clock
} from 'lucide-react';
import api from '../services/api';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  file_name: string;
  file_size_bytes: number;
  created_at: string;
  profiles?: {
    email: string;
  };
}

const AdminDashboard = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    console.log('AdminDashboard: Fetching global audit logs...');
    try {
      const response = await api.get('/audit-logs');
      console.log('AdminDashboard: Response received:', response.data);
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('AdminDashboard: Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.profiles?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || 
      log.action === actionFilter || 
      (actionFilter === 'ENCRYPT' && (log.action === 'ENCRYPT' || log.action === 'TEXT_ENCRYPT')) ||
      (actionFilter === 'DECRYPT' && (log.action === 'DECRYPT' || log.action === 'TEXT_DECRYPT')) ||
      (actionFilter === 'SIGN' && (log.action === 'FILE_SIGN' || log.action === 'KEY_GENERATE')) ||
      (actionFilter === 'VERIFY' && (log.action === 'SIGNATURE_VERIFY')) ||
      (actionFilter === 'INTEGRITY' && (log.action === 'INTEGRITY_CHECK'));
    
    return matchesSearch && matchesAction;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter tech-font uppercase">System_Audit</h2>
            <p className="text-muted max-w-2xl font-bold uppercase text-[10px] tracking-widest">Monitor all file operations across the platform. Gain insights into user activity.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="border-sharp bg-card p-6 flex items-center gap-5 shadow-2xl shadow-blue-500/5">
              <div className="w-14 h-14 bg-blue-600/10 rounded-none flex items-center justify-center border border-blue-500/20">
                <Activity className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total_Actions</p>
                <p className="text-3xl font-black tech-font">{logs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-sharp bg-card p-4 mb-8 flex flex-wrap gap-4 items-center shadow-xl shadow-blue-500/5">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/40 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH_BY_FILE_EMAIL_OR_ACTION..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-sharp pl-12 pr-6 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-placeholder text-xs"
            />
          </div>
          
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[var(--bg-main)] border border-sharp px-8 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-blue-500 uppercase text-[10px] tracking-widest cursor-pointer"
          >
            <option value="ALL">ALL_ACTIONS</option>
            <option value="ENCRYPT">ENCRYPTION</option>
            <option value="DECRYPT">DECRYPTION</option>
            <option value="SIGN">SIGNATURES</option>
            <option value="VERIFY">VERIFICATION</option>
            <option value="INTEGRITY">INTEGRITY</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 flex items-center gap-3 transition-all font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 glow-blue">
            <Download className="w-5 h-5" /> Export_Logs
          </button>
        </div>

        {/* Table */}
        <div className="border border-sharp bg-card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-sharp">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Timestamp</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Operator</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Protocol</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Identifier</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Data_Mass</th>
                </tr>
              </thead>
              <tbody className="divide-y border-sharp bg-transparent">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-10 py-8">
                        <div className="h-6 bg-blue-100 rounded-xl w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-5">
                        <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-300 border border-blue-200">
                          <Search className="w-10 h-10" />
                        </div>
                        <p className="text-blue-900/40 font-bold uppercase text-xs tracking-widest">No matching protocol records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-500/40" />
                          <span className="text-[10px] font-bold text-muted tracking-tight uppercase">
                            {new Date(log.created_at).toLocaleString().replace(/\//g, '_')}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 transition-all group-hover:bg-blue-600 group-hover:text-white">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold tech-font uppercase">
                            {log.profiles?.email?.split('@')[0] || 'ANON_OPS'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                          log.action.includes('ENCRYPT') ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' :
                          log.action.includes('DECRYPT') ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' :
                          log.action.includes('SIGN') || log.action.includes('KEY') ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' :
                          log.action.includes('INTEGRITY') ? 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20' :
                          'bg-white/5 text-muted border-sharp'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-500/40" />
                          <span className="text-xs font-bold tech-font max-w-[200px] truncate uppercase">
                            {log.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                          {formatSize(log.file_size_bytes)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
