
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'reels' | 'learn' | 'connect' | 'profile';
  onTabChange: (tab: 'reels' | 'learn' | 'connect' | 'profile') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-slate-950 shadow-2xl overflow-hidden border-x border-slate-800">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 glass h-20 flex items-center justify-around px-6 pb-2 z-50">
        <button 
          onClick={() => onTabChange('reels')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'reels' ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-widest">Reels</span>
        </button>

        <button 
          onClick={() => onTabChange('learn')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'learn' ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.082.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.082.477-4.5 1.253" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-widest">Learn</span>
        </button>

        <button 
          onClick={() => onTabChange('connect')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'connect' ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-widest">Chat</span>
        </button>

        <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-widest">Me</span>
        </button>
      </nav>
    </div>
  );
};
