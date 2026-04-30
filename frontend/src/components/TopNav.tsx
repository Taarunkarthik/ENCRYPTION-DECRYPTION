
import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown,
  SwitchCamera,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';

interface TopNavProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, signOut, role, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`fixed top-0 right-0 h-20 flex items-center justify-between px-8 z-40 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-sharp transition-all duration-500 ${
        isSidebarOpen ? 'left-72' : 'left-0'
      }`}
    >
      {/* Left Side: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-6">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 border border-sharp bg-white/5 backdrop-blur-md hover:bg-blue-600/10 transition-all text-blue-400"
          title={isSidebarOpen ? 'Collapse Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)'}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand — visible only when sidebar is hidden */}
        <div
          className={`flex items-center gap-4 transition-all duration-500 ${
            isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative p-2 bg-blue-600/10 border border-blue-500/30 glow-blue">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tighter tech-font leading-none">
                SECURE<span className="text-blue-500">VAULT</span>
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-blue-500/60 font-bold">
                Protocol_Gate
              </span>
            </div>
          </Link>

          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-sharp hover:bg-blue-600/10 transition-all text-xs font-bold tech-font text-muted hover:text-blue-400"
          >
            <LayoutDashboard className="w-4 h-4" />
            DASHBOARD
          </Link>
        </div>
      </div>

      {/* Right Side: Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 border border-sharp bg-white/5 backdrop-blur-md hover:bg-blue-600/10 transition-all text-muted hover:text-blue-500 group"
          title={theme === 'light' ? 'Activate Dark Protocol' : 'Activate Light Protocol'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 transition-transform group-hover:rotate-12" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 transition-transform group-hover:rotate-90" />
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 p-2 pr-4 border border-sharp bg-white/5 backdrop-blur-md hover:bg-blue-600/10 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center text-white glow-blue">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="hidden md:flex flex-col items-start min-w-0">
              <span className="text-xs font-bold tech-font truncate max-w-[120px]">
                {isGuest ? 'GUEST_USER' : user?.email?.split('@')[0].toUpperCase()}
              </span>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">
                {role?.toLowerCase() === 'admin' ? 'ADMIN_AUTH' : 'USER_AUTH'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 border-sharp bg-[var(--bg-main)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-4 border-b border-white/5">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                  Session_Status
                </p>
                <p className="text-xs font-mono truncate text-description">
                  {user?.email || 'GUEST_ACCESS'}
                </p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => { setIsOpen(false); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-muted hover:text-blue-500 hover:bg-blue-600/10 transition-all tech-font"
                >
                  <SwitchCamera className="w-4 h-4" />
                  SWITCH_USER
                </button>

                <Link
                  to="/support"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-muted hover:text-blue-500 hover:bg-blue-600/10 transition-all tech-font"
                >
                  <HelpCircle className="w-4 h-4" />
                  FEEDBACK_&amp;_SUPPORT
                </Link>

                <div className="my-2 border-t border-white/5"></div>

                <button
                  onClick={() => { setIsOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-muted hover:text-red-500 hover:bg-red-600/10 transition-all tech-font"
                >
                  <LogOut className="w-4 h-4" />
                  TERMINATE_SESSION
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
