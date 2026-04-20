import { Link } from 'react-router-dom';
import { Lock, Unlock, FileUp, FileDown, PenTool, ShieldCheck, Activity, ClipboardList, ShieldAlert, ArrowRight } from 'lucide-react';

const DashboardPage = () => {
  const tools = [
    { to: "/file-encrypt", icon: FileUp, title: "Upload & Encrypt File", desc: "Military-grade AES-256-GCM protection for your sensitive assets.", color: "blue" },
    { to: "/file-decrypt", icon: FileDown, title: "Upload & Decrypt File", desc: "Restore original data from your encrypted vault assets.", color: "blue" },
    { to: "/text-encrypt", icon: Lock, title: "Encrypt Text", desc: "Instantly transform messages into unbreakable cryptographic strings.", color: "blue" },
    { to: "/text-decrypt", icon: Unlock, title: "Decrypt Text", desc: "Decrypt secure communications with your master passphrase.", color: "blue" },
    { to: "/sign-file", icon: PenTool, title: "Sign a File", desc: "Apply RSA-SHA256 signatures to establish proof of origin.", color: "indigo" },
    { to: "/verify-signature", icon: ShieldCheck, title: "Verify File Signature", desc: "Validate the authenticity and integrity of signed resources.", color: "indigo" },
    { to: "/check-integrity", icon: Activity, title: "Check File Integrity", desc: "Compute and verify cryptographic checksums for consistency.", color: "slate" },
    { to: "/audit-log", icon: ClipboardList, title: "View My Audit Log", desc: "Review immutable records of all cryptographic operations.", color: "slate" },
  ];


  return (
    <div className="animate-slide-up space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse-slow"></div>
        
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold tracking-[0.3em] uppercase mb-10 animate-float">
          <ShieldAlert className="w-3.5 h-3.5" />
          Quantum-Resilient Protocol
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.1]">
          Define your digital <br /> 
          <span className="bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
            sovereignty.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-blue-500/60 max-w-2xl mx-auto leading-relaxed font-semibold">
          SecureVault provides the infrastructure for absolute data privacy. 
          The next generation of cryptographic tools for the modern era.
        </p>
      </section>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {tools.map((tool, idx) => (
          <Link
            key={idx}
            to={tool.to}
            className="group relative glass rounded-[2.5rem] p-10 transition-all duration-500 hover:-translate-y-3 border-blue-500/10 hover:border-blue-500/30 flex flex-col h-full overflow-hidden shadow-2xl shadow-transparent hover:shadow-blue-500/10"
          >
            {/* Hover Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mb-8 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-blue-500/20">
                <tool.icon className="w-7 h-7 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              
              <h2 className="text-2xl font-extrabold mb-4 group-hover:text-blue-500 transition-colors tracking-tight">{tool.title}</h2>
              
              <p className="text-sm text-blue-500/40 leading-relaxed mb-8 font-bold">
                {tool.desc}
              </p>
              
              <div className="mt-auto flex items-center gap-3 text-[10px] font-bold text-blue-500/30 group-hover:text-blue-500 transition-colors uppercase tracking-[0.2em]">
                Initialize Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Status / Call to Action */}
      <section className="glass rounded-[3rem] p-10 sm:p-16 border-blue-500/10 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -mr-64 -mt-64 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-400/5 blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-extrabold mb-4 tracking-tight">Need Enterprise Implementation?</h3>
            <p className="text-lg text-blue-500/40 font-bold">Our cryptographic experts are available for infrastructure consultation.</p>
          </div>
          
          <Link 
            to="/support"
            className="w-full lg:w-auto px-10 py-6 bg-blue-600 text-white font-extrabold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-2xl shadow-blue-600/30 active:scale-[0.98] text-center text-lg whitespace-nowrap"
          >
            Contact Security Protocol Division
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
