import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Activity, 
  Search, 
  Download, 
  User as UserIcon,
  Shield,
  FileText,
  Clock,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
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
    <div className="min-h-screen bg-blue-50/50 text-blue-950 font-outfit">
      {/* Sidebar/Nav */}
      {/* Sidebar/Nav */}
      <nav className="border-b border-blue-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase text-blue-950">Admin Console</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Audit Logs</Link>
              <Link to="/admin/users" className="text-blue-900/40 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">User Management</Link>
              <div className="h-6 w-px bg-blue-100"></div>
              <Link to="/" className="text-blue-900/40 hover:text-blue-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                Return to Infrastructure
              </Link>
              <button 
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="text-red-600 hover:text-red-700 flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-full transition-all border border-red-100 active:scale-95"
              >
                Sign Out <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter text-blue-950">System Audit Logs</h2>
            <p className="text-blue-900/40 max-w-2xl font-bold uppercase text-xs tracking-widest">Monitor all file operations across the platform. Gain insights into user activity.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="glass border-blue-100 rounded-[2rem] p-6 flex items-center gap-5 shadow-2xl shadow-blue-500/5">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center border border-blue-200">
                <Activity className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-900/40 uppercase tracking-widest mb-1">Total Actions</p>
                <p className="text-3xl font-black text-blue-950">{logs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass border-blue-100 rounded-[2.5rem] p-4 mb-8 flex flex-wrap gap-4 items-center shadow-xl shadow-blue-500/5">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by file, email or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all font-bold placeholder-blue-900/20 text-sm"
            />
          </div>
          
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-blue-50/50 border border-blue-100 rounded-2xl px-8 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all font-bold text-blue-600 uppercase text-xs tracking-widest cursor-pointer shadow-inner"
          >
            <option value="ALL">All Actions</option>
            <option value="ENCRYPT">Encryption</option>
            <option value="DECRYPT">Decryption</option>
            <option value="SIGN">Signatures</option>
            <option value="VERIFY">Verification</option>
            <option value="INTEGRITY">Integrity</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">
            <Download className="w-5 h-5" /> Export Logs
          </button>
        </div>

        {/* Table */}
        <div className="glass border-blue-100 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50/50 border-b border-blue-100">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Timestamp</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Resource Operator</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Protocol Action</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40">Identifier</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/40 text-right">Data Mass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
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
                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-300" />
                          <span className="text-xs font-bold text-blue-900/40 tracking-tight">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-400 border border-blue-100">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-blue-950">
                            {log.profiles?.email || 'Anonymous Operator'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border-2 ${
                          log.action.includes('ENCRYPT') ? 'bg-blue-100 text-blue-600 border-blue-200' :
                          log.action.includes('DECRYPT') ? 'bg-indigo-100 text-indigo-600 border-indigo-200' :
                          log.action.includes('SIGN') || log.action.includes('KEY') ? 'bg-purple-100 text-purple-600 border-purple-200' :
                          log.action.includes('INTEGRITY') ? 'bg-cyan-100 text-cyan-600 border-cyan-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-300" />
                          <span className="text-sm font-bold text-blue-950 max-w-[200px] truncate">
                            {log.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className="text-xs font-black text-blue-900/40 uppercase tracking-widest">
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
      </main>
    </div>
  );
};

export default AdminDashboard;
