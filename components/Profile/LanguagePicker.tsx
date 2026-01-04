
import React from 'react';
import { LANGUAGES } from '../../constants';

interface LanguagePickerProps {
  currentLanguage: string;
  onSelect: (lang: string) => void;
  onClose: () => void;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ currentLanguage, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white">Select Language</h2>
          <button onClick={onClose} className="p-2 glass rounded-full text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-slate-400 text-sm mb-6">Choose the language you want to master. Your lessons and AI tutor will adapt to this choice.</p>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-2 custom-scrollbar">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onSelect(lang);
                onClose();
              }}
              className={`p-4 rounded-2xl text-left transition-all duration-200 border ${
                currentLanguage === lang 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/50' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold">{lang}</div>
              <div className={`text-[10px] uppercase tracking-tighter ${currentLanguage === lang ? 'text-blue-200' : 'text-slate-600'}`}>
                {currentLanguage === lang ? 'Current' : 'Select'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
