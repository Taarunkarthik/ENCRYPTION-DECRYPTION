import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  Users, 
  Trash2, 
  Mail, 
  Shield, 
  Calendar,
  Search,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const UserManagement = () => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-outfit">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">Admin Console</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors font-bold">Audit Logs</Link>
              <Link to="/admin/users" className="text-indigo-400 font-bold border-b-2 border-indigo-400 pb-1">User Management</Link>
              <Link to="/" className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-full transition-all">
                Exit Admin <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-4xl font-black mb-4 tracking-tight">User Directory</h2>
            <p className="text-slate-400 max-w-2xl font-medium">Manage platform access and user permissions. You can view, filter, and remove user accounts.</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Users</p>
              <p className="text-2xl font-black">{users.length}</p>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{statusMessage.text}</span>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search users by email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
                    <div className="h-3 bg-slate-800 rounded-full w-1/2"></div>
                  </div>
                </div>
                <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-900 border border-slate-800 rounded-[3rem]">
               <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold">No users found</p>
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 hover:border-slate-700 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg group-hover:shadow-indigo-500/20">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-white truncate max-w-[150px]">{user.email?.split('@')[0]}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={() => toggleUserRole(user.id, user.role)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Shield className="w-5 h-5" /> 
                    {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.role === 'admin' || isDeleting === user.id}
                    className="w-14 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-red-500/20 disabled:opacity-30 disabled:hover:bg-slate-800"
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
