
import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(location.pathname === '/');

  // Sync sidebar state with location if needed, or just let it be manual after initial load
  // For now, let's allow it to be manual.
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex overflow-x-hidden">
      {/* Fixed Sidebar with Slide Animation */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className={`flex-grow flex flex-col relative min-h-screen transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Dynamic Background Grid */}
        <div className="fixed inset-0 z-0 bg-grid opacity-20 pointer-events-none"></div>
        
        {/* Glow Effects (Subtle for both themes) */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full"></div>
        </div>

        {/* Top Navigation */}
        <TopNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Content Wrapper */}
        <main className="relative z-10 flex-grow px-8 py-12 lg:px-16 lg:py-20 mt-24">
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
