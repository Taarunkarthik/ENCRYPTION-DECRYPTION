
import React from 'react';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen transition-colors duration-500 overflow-x-hidden flex flex-col relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-400/10 blur-[100px] rounded-full animate-float"></div>
        <div className="absolute inset-0 bg-mesh opacity-60"></div>
        <div className="absolute inset-0 noise"></div>
      </div>

      <Navbar />
      
      <main className="relative z-10 flex-grow pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 py-10 text-center border-t border-white/5 bg-blue-500/5 backdrop-blur-md mt-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase font-bold text-blue-500/40">&copy; {new Date().getFullYear()} SecureVault Infrastructure &bull; Advanced Security Suite</p>
      </footer>
    </div>
  );
};


export default MainLayout;
