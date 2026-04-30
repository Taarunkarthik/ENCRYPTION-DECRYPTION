
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Settings, User as UserIcon, ChevronDown, HelpCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, signOut, role, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = role?.toLowerCase() === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="w-full glass sticky top-0 z-50 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-600/20 transition-all duration-300">
                <ShieldAlert className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">
                Secure<span className="text-blue-600">Vault</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-500 font-bold leading-none">Security Suite</span>
            </div>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all duration-300 group active:scale-90"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-blue-600 animate-slide-up" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400 animate-slide-up" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="group flex items-center gap-2.5 p-1 pr-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-sm font-bold">
                    {isGuest ? 'Guest User' : (user?.email?.split('@')[0])}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-3 w-64 glass rounded-2xl shadow-2xl py-2 z-20 animate-scale-in overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 bg-blue-500/5 mb-2">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Session Identity</p>
                      <p className="text-sm font-bold truncate">
                        {isGuest ? 'Guest Mode Access' : user?.email}
                      </p>
                      {!isGuest && (
                        <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          Authenticated {isAdmin ? 'Administrator' : 'User'}
                        </p>
                      )}
                    </div>
                    
                    <div className="px-2 space-y-1">
                      {isGuest ? (
                        <>
                           <Link
                            to="/login"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-500/10 rounded-xl transition-all font-medium"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <UserIcon className="w-4 h-4 text-blue-400" />
                            Log In to Account
                          </Link>
                          <Link
                            to="/signup"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all font-bold"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <ShieldAlert className="w-4 h-4 text-blue-500" />
                            Create New Account
                          </Link>
                        </>
                      ) : (
                        <>
                          {isAdmin && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-500/10 rounded-xl transition-all font-medium"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4 text-blue-400" />
                              Admin Infrastructure
                            </Link>
                          )}
                        </>
                      )}

                          <Link
                            to="/support"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-500/10 rounded-xl transition-all font-medium"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <HelpCircle className="w-4 h-4 text-blue-400" />
                            Support & Feedback
                          </Link>
   
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all mt-2 ${
                          isGuest 
                            ? 'text-blue-500/40 hover:bg-blue-500/10' 
                            : 'text-red-500 hover:bg-red-500/10 font-bold'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        {isGuest ? 'Exit Guest Session' : 'Terminate Session'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

  );
};

export default Navbar;
