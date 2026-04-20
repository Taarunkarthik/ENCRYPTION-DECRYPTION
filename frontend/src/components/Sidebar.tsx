
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FileUp, 
  FileDown, 
  Type, 
  FileSignature, 
  ShieldCheck, 
  Activity, 
  History, 
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { role } = useAuth();
  const location = useLocation();

  const menuItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/file-encrypt", icon: FileUp, label: "Encrypt File" },
    { to: "/file-decrypt", icon: FileDown, label: "Decrypt File" },
    { to: "/text-encrypt", icon: Type, label: "Encrypt Text" },
    { to: "/text-decrypt", icon: Type, label: "Decrypt Text" },
    { to: "/sign-file", icon: FileSignature, label: "Sign File" },
    { to: "/verify-signature", icon: ShieldCheck, label: "Verify Signature" },
    { to: "/check-integrity", icon: Activity, label: "Integrity Check" },
    { to: "/audit-log", icon: History, label: "Audit Logs" },
  ];

  return (
    <div className="w-72 h-screen fixed left-0 top-0 bg-[var(--bg-main)] border-r border-sharp flex flex-col z-50">
      {/* Brand Header */}
      <div className="p-8 border-b border-sharp bg-gradient-to-b from-blue-600/5 to-transparent">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative p-2 bg-blue-600/10 border border-blue-500/30 glow-blue">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter tech-font">
              SECURE<span className="text-blue-500">VAULT</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-blue-500/60 font-bold leading-none">Infrastructure</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow py-6 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] px-4 mb-2">Main Protocol</p>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group ${
                  isActive 
                    ? 'nav-item-active' 
                    : 'text-zinc-500 hover:text-blue-400 hover:bg-blue-600/5'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                <span className="tech-font">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 glow-blue"></div>}
              </Link>
            );
          })}
        </div>

        {role === 'admin' && (
          <div className="px-4 mb-4">
            <p className="text-[10px] font-bold text-blue-500/40 uppercase tracking-[0.2em] px-4 mb-2">Admin Control</p>
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group ${
                location.pathname.startsWith('/admin') 
                  ? 'nav-item-active' 
                  : 'text-zinc-500 hover:text-blue-400 hover:bg-blue-600/5'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="tech-font">Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
