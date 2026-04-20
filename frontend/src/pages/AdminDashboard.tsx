import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User as UserIcon,
  Shield,
  FileText,
  Clock,
  ArrowRight,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-outfit">
      {/* Sidebar/Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">Admin Console</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="text-blue-400 font-bold border-b-2 border-blue-400 pb-1">Audit Logs</Link>
              <Link to="/admin/users" className="text-slate-400 hover:text-white transition-colors font-bold">User Management</Link>
              <div className="h-6 w-px bg-slate-800"></div>
              <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-all">
                Exit Admin
              </Link>
              <button 
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-full transition-all border border-red-500/20"
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
            <h2 className="text-4xl font-black mb-4 tracking-tight">System Audit Logs</h2>
            <p className="text-slate-400 max-w-2xl font-medium">Monitor all file operations across the platform. Gain insights into user activity and system performance.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Actions</p>
                <p className="text-2xl font-black">{logs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by file, email or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-slate-400"
          >
            <option value="ALL">All Actions</option>
            <option value="ENCRYPT">Encryption (File/Text)</option>
            <option value="DECRYPT">Decryption (File/Text)</option>
            <option value="SIGN">Signatures/Keys</option>
            <option value="VERIFY">Verification</option>
            <option value="INTEGRITY">Integrity Checks</option>
          </select>
          
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold">
            <Download className="w-5 h-5" /> Export
          </button>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">User</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Action</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Resource</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6 h-20">
                        <div className="h-4 bg-slate-800 rounded-full w-full opacity-50"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                          <Search className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-bold">No logs found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-white">
                            {log.profiles?.email || 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          log.action.includes('ENCRYPT') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          log.action.includes('DECRYPT') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          log.action.includes('SIGN') || log.action.includes('KEY') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          log.action.includes('INTEGRITY') ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-300 max-w-[200px] truncate">
                            {log.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-bold text-slate-500">
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
