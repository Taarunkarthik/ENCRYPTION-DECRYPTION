import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Users, 
  Trash2, 
  Mail, 
  Shield, 
  Calendar,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const UserManagement = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setIsDeleting(userId);
    try {
      // Call backend to delete from auth.users
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== userId));
      setStatusMessage({ type: 'success', text: 'User and all associated data removed successfully.' });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete user. Admin privileges required.' });
    } finally {
      setIsDeleting(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setStatusMessage({ type: 'success', text: `User role updated to ${newRole}.` });
    } catch (err: any) {
      console.error('Error updating role:', err);
      setStatusMessage({ type: 'error', text: 'Failed to update user role.' });
    } finally {
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <nav className="border-b border-sharp bg-[var(--bg-main)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center glow-blue">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter tech-font uppercase">Admin_Console</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="text-muted hover:text-blue-500 transition-colors font-bold uppercase text-[10px] tracking-widest">Audit_Logs</Link>
              <Link to="/admin/users" className="text-blue-500 font-bold border-b-2 border-blue-500 pb-1 text-[10px] uppercase tracking-widest">User_Management</Link>
              <div className="h-6 w-px bg-white/10"></div>
              <Link to="/" className="text-muted hover:text-blue-500 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
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
            <h2 className="text-5xl font-black mb-4 tracking-tighter tech-font uppercase">User_Directory</h2>
            <p className="text-muted max-w-2xl font-bold uppercase text-[10px] tracking-widest">Manage platform access and user permissions. View, filter, and moderate accounts.</p>
          </div>
          
          <div className="border-sharp bg-card p-6 flex items-center gap-5 shadow-2xl shadow-blue-500/5">
            <div className="w-14 h-14 bg-blue-600/10 rounded-none flex items-center justify-center border border-blue-500/20">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Active_Users</p>
              <p className="text-3xl font-black tech-font">{users.length}</p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-8 p-5 flex items-center gap-4 border animate-in slide-in-from-top-4 ${
            statusMessage.type === 'success' ? 'bg-blue-600/10 border-blue-500/30 text-blue-500' : 'bg-red-600/10 border-red-500/30 text-red-500'
          }`}>
            <div className={`p-2 ${statusMessage.type === 'success' ? 'bg-blue-600/20' : 'bg-red-600/20'}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <span className="font-bold uppercase text-[10px] tracking-widest">{statusMessage.text}</span>
          </div>
        )}

        <div className="border-sharp bg-card p-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/40 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH_OPERATORS_BY_EMAIL_OR_ROLE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-sharp pl-12 pr-6 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-placeholder text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="glass border-blue-100 rounded-[2.5rem] p-8 animate-pulse shadow-xl shadow-blue-500/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-3xl"></div>
                  <div className="space-y-3 flex-1">
                    <div className="h-4 bg-blue-100 rounded-full w-3/4"></div>
                    <div className="h-3 bg-blue-100 rounded-full w-1/2"></div>
                  </div>
                </div>
                <div className="h-12 bg-blue-100 rounded-2xl w-full"></div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full py-20 text-center glass border-blue-100 rounded-[3rem] shadow-xl shadow-blue-500/5">
               <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-300 border border-blue-200">
                  <Users className="w-10 h-10" />
                </div>
                <p className="text-blue-900/40 font-bold uppercase text-xs tracking-widest">No matching operators found</p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="border-sharp bg-card p-8 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-2xl shadow-blue-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:scale-125"></div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl group-hover:shadow-blue-500/20">
                      <Mail className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black tech-font truncate max-w-[150px] text-lg tracking-tighter uppercase">{user.email?.split('@')[0]}</h3>
                      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{user.role}</p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                    user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-muted border-sharp'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="space-y-4 mb-10 relative z-10">
                  <div className="flex items-center gap-4 text-muted group-hover:text-blue-400 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-tight truncate uppercase">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted group-hover:text-blue-400 transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Since_{new Date(user.created_at).toLocaleDateString().replace(/\//g, '_')}</span>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <button 
                    onClick={() => toggleUserRole(user.id, user.role)}
                    className="flex-1 border border-sharp bg-white/5 hover:bg-blue-600 hover:text-white text-blue-500 font-black py-4 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg active:scale-95 text-[10px] uppercase tracking-widest"
                  >
                    <Shield className="w-4 h-4" /> 
                    {user.role === 'admin' ? 'Revoke_Access' : 'Elevate_Access'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.role === 'admin' || isDeleting === user.id}
                    className="w-16 border border-red-500/20 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 font-black py-4 transition-all flex items-center justify-center disabled:opacity-10 active:scale-95"
                  >
                    {isDeleting === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
