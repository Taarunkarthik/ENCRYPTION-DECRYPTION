
import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex overflow-x-hidden">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-grow ml-72 flex flex-col relative min-h-screen">
        {/* Dynamic Background Grid */}
        <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none"></div>
        
        {/* Glow Effects (Subtle for both themes) */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full"></div>
        </div>

        {/* Top Navigation */}
        <TopNav />

        {/* Content Wrapper */}
        <main className="relative z-10 flex-grow px-8 py-12 lg:px-16 lg:py-20 mt-16">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Minimal Tech Footer */}
        <footer className="relative z-10 py-8 px-12 border-t border-sharp bg-[var(--bg-main)]/50 backdrop-blur-sm mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
            <p className="text-[9px] tracking-[0.5em] uppercase font-bold text-blue-500">
              &copy; {new Date().getFullYear()} SECUREVAULT_INFRASTRUCTURE // CORE_V2.0
            </p>
            <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest">
              <span>STATUS: <span className="text-emerald-500">OPERATIONAL</span></span>
              <span>ENCRYPTION: <span className="text-blue-500">AES_256_GCM</span></span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
