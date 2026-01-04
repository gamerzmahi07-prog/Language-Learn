
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { VideoFeed } from './components/Reels/VideoFeed';
import { LearnDashboard } from './components/Learn/LearnDashboard';
import { LessonPlayer } from './components/Learn/LessonPlayer';
import { ChatList } from './components/Connect/ChatList';
import { ChatRoom } from './components/Connect/ChatRoom';
import { LanguagePicker } from './components/Profile/LanguagePicker';
import { Registration } from './components/Auth/Registration';
import { User, Lesson } from './types';
import { generateLesson } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reels' | 'learn' | 'connect' | 'profile'>('reels');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<{ name: string; avatar: string; lang: string } | null>(null);

  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    const saved = localStorage.getItem('lingosocial_user');
    return !!saved && JSON.parse(saved).name !== '';
  });
  
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('lingosocial_user');
    return saved ? JSON.parse(saved) : {
      id: '',
      name: '',
      avatar: '',
      nativeLanguage: '',
      targetLanguage: '',
      xp: 0,
      lessonsCompleted: 0,
      proficiencyKeyUnlocked: false
    };
  });
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isRegistered && user.name) {
      localStorage.setItem('lingosocial_user', JSON.stringify(user));
    }
  }, [user, isRegistered]);

  const handleRegistration = (newUser: User) => {
    setUser(newUser);
    setIsRegistered(true);
    setActiveTab('learn'); 
  };

  const handleSignOut = () => {
    localStorage.removeItem('lingosocial_user');
    setUser({
      id: '',
      name: '',
      avatar: '',
      nativeLanguage: '',
      targetLanguage: '',
      xp: 0,
      lessonsCompleted: 0,
      proficiencyKeyUnlocked: false
    });
    setIsRegistered(false);
    window.location.reload();
  };

  const updateTargetLanguage = (lang: string) => {
    setUser(prev => ({ ...prev, targetLanguage: lang }));
  };

  const startLesson = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const lesson = await generateLesson(user.targetLanguage, user.lessonsCompleted + 1);
      setCurrentLesson(lesson);
    } catch (error) {
      console.error("Critical: Failed to generate lesson", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLesson = () => {
    setUser(prev => {
      const newCount = prev.lessonsCompleted + 1;
      return {
        ...prev,
        lessonsCompleted: newCount,
        xp: prev.xp + 100,
        proficiencyKeyUnlocked: newCount >= 10
      };
    });
    setCurrentLesson(null);
    setActiveTab('learn');
  };

  if (!isRegistered) {
    return <Registration onComplete={handleRegistration} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'reels':
        return <VideoFeed />;
      case 'learn':
        return (
          <LearnDashboard 
            user={user} 
            onStartLesson={startLesson} 
            isLoading={isLoading}
          />
        );
      case 'connect':
        return (
          <ChatList 
            unlocked={user.proficiencyKeyUnlocked} 
            onSelectPeer={setSelectedPeer} 
          />
        );
      case 'profile':
        return (
          <div className="p-8 text-center flex flex-col items-center animate-in fade-in duration-500">
            <div className="relative mb-6 group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
              <img src={user.avatar} className="relative w-32 h-32 rounded-full border-4 border-slate-950 shadow-2xl" alt="Profile" />
            </div>
            <h1 className="text-3xl font-black text-white">{user.name}</h1>
            <p className="text-blue-400 font-bold tracking-widest uppercase text-[10px] mt-2 bg-blue-500/10 px-3 py-1 rounded-full">Explorer • Level {Math.floor(user.xp / 100) + 1}</p>
            
            <button 
              onClick={() => setShowLangPicker(true)}
              className="mt-8 w-full glass-card p-4 rounded-3xl flex items-center justify-between border border-blue-500/20 hover:border-blue-500 transition-all"
            >
              <div className="text-left">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Target Language</span>
                <p className="text-lg font-bold text-white">{user.targetLanguage}</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </button>

            <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-sm">
              <div className="flex flex-col">
                <span className="text-xl font-black text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Streak</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white">{user.lessonsCompleted}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Lessons</span>
              </div>
            </div>

            <div className="w-full space-y-3 mt-12">
              <button 
                onClick={handleSignOut}
                className="w-full bg-slate-900 border border-slate-800 text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-800 hover:text-white transition-all"
              >
                Sign Out
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Reset My Account & Progress
              </button>
            </div>
          </div>
        );
      default:
        return <VideoFeed />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
      
      {showLangPicker && (
        <LanguagePicker 
          currentLanguage={user.targetLanguage} 
          onSelect={updateTargetLanguage} 
          onClose={() => setShowLangPicker(false)} 
        />
      )}

      {currentLesson && (
        <LessonPlayer 
          lesson={currentLesson} 
          targetLanguage={user.targetLanguage}
          onComplete={completeLesson} 
          onExit={() => setCurrentLesson(null)} 
        />
      )}

      {selectedPeer && (
        <ChatRoom 
          peer={selectedPeer} 
          onBack={() => setSelectedPeer(null)} 
        />
      )}
    </Layout>
  );
};

export default App;
