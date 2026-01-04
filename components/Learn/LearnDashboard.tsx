
import React from 'react';
import { User, Lesson } from '../../types';
import { InteractiveHoverButton } from '../ui/InteractiveHoverButton';

interface LearnDashboardProps {
  user: User;
  onStartLesson: () => void;
  onDebugComplete?: () => void;
  isLoading: boolean;
}

export const LearnDashboard: React.FC<LearnDashboardProps> = ({ user, onStartLesson, onDebugComplete, isLoading }) => {
  const nextLessonNum = user.lessonsCompleted + 1;
  const progressPercent = Math.min((user.lessonsCompleted / 10) * 100, 100);

  return (
    <div className="p-6">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Progress</h1>
          <p className="text-slate-400 text-sm">Target: <span className="text-blue-400 font-semibold">{user.targetLanguage}</span></p>
        </div>
        {onDebugComplete && (
          <button 
            onClick={onDebugComplete}
            className="text-[10px] bg-slate-800 text-slate-500 px-2 py-1 rounded border border-slate-700 hover:text-white transition-colors"
          >
            DEBUG: +1 Lesson
          </button>
        )}
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-blue-400">{user.xp}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">XP Points</span>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-purple-400">{user.lessonsCompleted}/10</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">To Unlock Chat</span>
        </div>
      </div>

      {/* Proficiency Key Goal */}
      <div className="glass-card p-6 rounded-3xl mb-8 border-blue-500/20 relative overflow-hidden">
        {user.proficiencyKeyUnlocked && (
          <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter animate-pulse">
            Unlocked
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl transition-all duration-500 ${user.proficiencyKeyUnlocked ? 'bg-blue-600 scale-110 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-100">Proficiency Key</h4>
              <p className="text-xs text-slate-500">Unlocks Social Matching</p>
            </div>
          </div>
          <span className="text-xs font-black text-blue-400">{Math.floor(progressPercent)}%</span>
        </div>
        
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-200">Recommended Next</h3>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-l-blue-600">
           <div className="mb-6">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Lesson {nextLessonNum}</p>
              <h4 className="text-xl font-bold text-white mb-2">
                {isLoading ? 'Generating Context...' : 'Daily Mastery & Immersion'}
              </h4>
              <p className="text-sm text-slate-500">Includes 10 vocab terms, 6 phrases, and a full reading story with AI audio.</p>
           </div>
           
           <InteractiveHoverButton 
             text={isLoading ? 'Brewing Lesson...' : 'Start Extensive Lesson'} 
             onClick={onStartLesson}
             disabled={isLoading}
             className={isLoading ? 'opacity-50 pointer-events-none' : ''}
           />
        </div>
      </div>
    </div>
  );
};
