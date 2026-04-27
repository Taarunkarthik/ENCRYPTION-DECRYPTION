import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LogOut,
  Search,
  MessageSquare,
  User,
  UserRound,
  Clock,
  Mail,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface FeedbackEntry {
  id: string;
  userId: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface FeedbackApiEntry {
  id?: string;
  userId?: string | null;
  user_id?: string | null;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

const AdminFeedback = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/feedback');
      const normalized: FeedbackEntry[] = (response.data || []).map((item: FeedbackApiEntry) => ({
        id: item.id || '',
        userId: item.userId ?? item.user_id ?? null,
        email: item.email || '',
        subject: item.subject || '(No Subject)',
        message: item.message || '',
        status: item.status || 'OPEN',
        createdAt: item.createdAt ?? item.created_at ?? '',
      }));
      setEntries(normalized);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (value: string) => {
    if (!value) return 'UNKNOWN_TIME';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'UNKNOWN_TIME';
    return parsed.toLocaleString().replace(/\//g, '_');
  };

  const filteredEntries = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return entries;

    return entries.filter((entry) =>
      entry.email.toLowerCase().includes(term) ||
      entry.subject.toLowerCase().includes(term) ||
      entry.message.toLowerCase().includes(term) ||
      (entry.userId || '').toLowerCase().includes(term)
    );
  }, [entries, query]);

  const handleStatusUpdate = async (entryId: string, nextStatus: string) => {
    if (!entryId) {
      setError('Cannot update feedback status: missing feedback ID.');
      return;
    }

    setUpdatingId(entryId);
    setError('');

    try {
      const response = await api.patch(`/admin/feedback/${entryId}/status`, {
        status: nextStatus,
      });

      const updatedStatus = response?.data?.status || nextStatus;
      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId ? { ...entry, status: updatedStatus } : entry
        )
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update feedback status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter tech-font uppercase">Support_Inbox</h2>
            <p className="text-muted max-w-2xl font-bold uppercase text-[10px] tracking-widest">Visibility of every support and feedback message sent by users and guests.</p>
          </div>

          <div className="border-sharp bg-card p-6 flex items-center gap-5 shadow-2xl shadow-blue-500/5">
            <div className="w-14 h-14 bg-blue-600/10 rounded-none flex items-center justify-center border border-blue-500/20">
              <MessageSquare className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total_Entries</p>
              <p className="text-3xl font-black tech-font">{entries.length}</p>
            </div>
          </div>
        </div>

        <div className="border-sharp bg-card p-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/40 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH_BY_EMAIL_SUBJECT_MESSAGE_OR_USER_ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-sharp pl-12 pr-6 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-placeholder text-xs"
            />
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 border border-red-500/30 bg-red-600/10 text-red-500 font-bold uppercase text-[10px] tracking-widest">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="border-sharp bg-card p-8 animate-pulse">
                <div className="h-5 bg-blue-100 rounded w-2/5 mb-4"></div>
                <div className="h-4 bg-blue-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-blue-100 rounded w-full"></div>
              </div>
            ))
          ) : filteredEntries.length === 0 ? (
            <div className="border-sharp bg-card p-20 text-center">
              <p className="text-muted font-bold uppercase text-[10px] tracking-widest">No support messages found</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="border-sharp bg-card p-8 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${
                      entry.userId ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {entry.userId ? (
                        <><User className="w-3.5 h-3.5 mr-2" /> USER</>
                      ) : (
                        <><UserRound className="w-3.5 h-3.5 mr-2" /> GUEST</>
                      )}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest border bg-white/5 text-muted border-sharp">
                      {entry.status || 'OPEN'}
                    </span>
                    <select
                      value={entry.status || 'OPEN'}
                      onChange={(e) => handleStatusUpdate(entry.id, e.target.value)}
                      disabled={updatingId === entry.id}
                      className="bg-[var(--bg-main)] border border-sharp px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-500 disabled:opacity-50"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-muted">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{formatTimestamp(entry.createdAt)}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black tech-font uppercase mb-2 tracking-tight">{entry.subject}</h3>

                <div className="flex items-center gap-2 text-blue-400 mb-5">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-tight">{entry.email}</span>
                </div>

                <p className="text-sm leading-relaxed text-[var(--text-main)]/85 whitespace-pre-wrap">{entry.message}</p>

                <div className="mt-6 pt-4 border-t border-sharp text-[10px] font-bold uppercase tracking-widest text-muted">
                  Sender_ID: {entry.userId || 'guest-session'}
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};

export default AdminFeedback;