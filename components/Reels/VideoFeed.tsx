
import React, { useRef, useState, useEffect } from 'react';
import { MOCK_REELS } from '../../constants';

export const VideoFeed: React.FC = () => {
  const [activeReel, setActiveReel] = useState(0);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPos = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== activeReel) {
      setActiveReel(index);
    }
  };

  return (
    <div className="reel-container" onScroll={handleScroll}>
      {MOCK_REELS.map((reel, index) => (
        <div key={reel.id} className="reel-item relative bg-black overflow-hidden">
          <video 
            src={reel.videoUrl} 
            className="w-full h-full object-cover"
            autoPlay={index === activeReel}
            loop
            muted
            playsInline
          />
          
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 pb-24">
            <div className="flex items-center gap-3 mb-4">
              <img src={reel.creator.avatar} alt={reel.creator.name} className="w-10 h-10 rounded-full border-2 border-blue-500" />
              <div>
                <h3 className="font-bold text-white text-sm">@{reel.creator.name}</h3>
                <p className="text-xs text-blue-300 font-medium">{reel.language}</p>
              </div>
              <button className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 transition-colors">
                Follow
              </button>
            </div>
            
            <p className="text-sm text-slate-100 mb-4 line-clamp-3 leading-relaxed">
              {reel.caption}
            </p>

            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 group cursor-pointer">
                <div className="p-2 rounded-full glass group-hover:bg-red-500/20 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-200">{reel.likes}</span>
              </div>
              
              <div className="flex items-center gap-1.5 group cursor-pointer">
                <div className="p-2 rounded-full glass group-hover:bg-blue-500/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-200">Share</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
