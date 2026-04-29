
import { Link } from 'react-router-dom';
import { Lock, Unlock, FileUp, FileDown, PenTool, ShieldCheck, Activity, ClipboardList, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { role } = useAuth();

  const allTools = [
    { to: "/file-encrypt", icon: FileUp, title: "FILE_ENCRYPTION", desc: "AES-256-GCM authenticated encryption for system assets.", color: "blue" },
    { to: "/file-decrypt", icon: FileDown, title: "FILE_DECRYPTION", desc: "Cryptographic restoration of original data structures.", color: "blue" },
    { to: "/text-encrypt", icon: Lock, title: "TEXT_ENCRYPT", desc: "Transformation of raw strings into secure ciphertexts.", color: "blue" },
    { to: "/text-decrypt", icon: Unlock, title: "TEXT_DECRYPT", desc: "Deciphering secure messages via master passphrase.", color: "blue" },
    { to: "/sign-file", icon: PenTool, title: "RSA_SIGNING", desc: "Apply digital signatures for origin verification.", color: "blue" },
    { to: "/verify-signature", icon: ShieldCheck, title: "SIGN_VERIFY", desc: "Validate authenticity of signed system resources.", color: "blue" },
    { to: "/check-integrity", icon: Activity, title: "INTEGRITY_CHECK", desc: "Checksum verification for data consistency auditing.", color: "blue" },
    { to: "/audit-log", icon: ClipboardList, title: "AUDIT_RECORDS", desc: "Immutable trail of all cryptographic operations.", color: "blue" },
  ];

  const tools = allTools;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <header className="border-l-4 border-blue-600 pl-8 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
          <ShieldAlert className="w-3 h-3" />
          System Status: Operational
        </div>
        <h1 className="text-6xl font-black tracking-tighter tech-font mb-4">
          CORE_<span className="text-blue-500">INFRASTRUCTURE</span>
        </h1>
        <p className="text-muted max-w-2xl font-medium leading-relaxed">
          Centralized command interface for SecureVault's advanced cryptographic suite. 
          Manage encryption protocols, digital signatures, and integrity audits from a single unified workspace.
        </p>
      </header>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, idx) => (
          <Link
            key={idx}
            to={tool.to}
            className="group relative border-card bg-card p-8 transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-600/5 border overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <tool.icon className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <tool.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold text-muted group-hover:text-blue-500/50 transition-colors uppercase tracking-[0.2em]">
                  Protocol_0{idx + 1}
                </div>
              </div>
              
              <h2 className="text-xl font-bold tech-font mb-2 group-hover:text-blue-400 transition-colors tracking-tight">
                {tool.title}
              </h2>
              
              <p className="text-sm text-muted leading-relaxed mb-8 max-w-xs">
                {tool.desc}
              </p>
              
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/40 group-hover:text-blue-500 transition-all uppercase tracking-[0.3em]">
                INITIALIZE <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Sharp corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-card group-hover:border-blue-500/50 transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-card group-hover:border-blue-500/50 transition-colors"></div>
          </Link>
        ))}
      </div>

      {/* Support Banner */}
      <div className="border-card bg-blue-600/5 p-12 relative overflow-hidden group border">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] -mr-32 -mt-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold tech-font mb-2 uppercase tracking-tight">Technical Implementation</h3>
            <p className="text-muted max-w-xl text-sm font-medium">
              Access deep-level documentation and cryptographic specifications for enterprise-grade integration of our core protocols.
            </p>
          </div>
          
          <Link 
            to="/support"
            className="px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 transition-all glow-blue hover:glow-blue-strong active:scale-95"
          >
            Request Specs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
