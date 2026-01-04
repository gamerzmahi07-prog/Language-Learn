
import React from 'react';

interface ChatListProps {
  unlocked: boolean;
  onSelectPeer: (peer: { name: string; avatar: string; lang: string }) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ unlocked, onSelectPeer }) => {
  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className="absolute -top-1 -right-1 bg-blue-600 p-2 rounded-full border-4 border-slate-950">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chat is Locked</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Complete 10 lessons to earn your <span className="text-blue-400 font-bold">Proficiency Key</span> and start matching with native speakers.
        </p>
        <button className="bg-slate-800 px-6 py-2 rounded-full text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
          Learn More
        </button>
      </div>
    );
  }

  const peers = [
    { name: 'Elena', lang: 'Spanish', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=elena' },
    { name: 'Yuki', lang: 'Japanese', status: 'Busy', avatar: 'https://i.pravatar.cc/150?u=yuki' },
    { name: 'Marco', lang: 'Italian', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=marco' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Connect</h2>
      <div className="space-y-4">
        {peers.map((peer, i) => (
          <div 
            key={i} 
            onClick={() => onSelectPeer(peer)}
            className="glass-card p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={peer.avatar} className="w-14 h-14 rounded-full border border-slate-700 group-hover:border-blue-500 transition-colors" />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${peer.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
              </div>
              <div>
                <h4 className="font-bold text-white">{peer.name}</h4>
                <p className="text-xs text-slate-500">{peer.lang} Native</p>
              </div>
            </div>
            <button className="bg-blue-600/10 text-blue-400 p-2.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
