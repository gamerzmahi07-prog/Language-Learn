
import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGES } from '../../constants';
import { User, LanguageLevel } from '../../types';
import { InteractiveHoverButton } from '../ui/InteractiveHoverButton';

interface RegistrationProps {
  onComplete: (user: User) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  // Steps: 0: Splash, 1: Email Input, 2: OTP Verify, 3: Name, 4: Languages, 5: Level
  const [step, setStep] = useState(0); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [name, setName] = useState('');
  const [nativeLang, setNativeLang] = useState('English');
  const [targetLang, setTargetLang] = useState('');
  const [level, setLevel] = useState<LanguageLevel>(LanguageLevel.BEGINNER);
  const [error, setError] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = () => {
    const code = otp.join('');
    if (code.length < 6) return;
    
    setIsVerifying(true);
    setError('');

    setTimeout(() => {
      if (code === '123456') { 
        setStep(3);
        setIsVerifying(false);
      } else {
        setError('Invalid verification code. Try 123456 for the demo.');
        setIsVerifying(false);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    }, 1500);
  };

  const handleFinish = () => {
    if (!name || !targetLang) return;
    const newUser: User = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      nativeLanguage: nativeLang,
      targetLanguage: targetLang,
      xp: 0,
      lessonsCompleted: 0,
      proficiencyKeyUnlocked: false
    };
    onComplete(newUser);
  };

  const renderEmailStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-sm">Enter your Gmail to receive a code</p>
      </div>
      <div className="relative">
        <input
          autoFocus
          type="email"
          placeholder="name@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-blue-500 transition-all text-lg font-medium"
        />
      </div>
      <InteractiveHoverButton 
        text="Send Code" 
        onClick={() => setStep(2)}
        disabled={!email.includes('@')}
        className={!email.includes('@') ? 'opacity-30' : ''}
      />
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Or</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <button className="w-full bg-white text-slate-950 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
        <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
        Continue with Google
      </button>
    </div>
  );

  const renderOtpStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Check your Email</h2>
        <p className="text-slate-400 text-sm">We sent a 6-digit code to <br/><span className="text-blue-400 font-bold">{email}</span></p>
      </div>
      
      <div className="flex justify-between gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`w-12 h-16 bg-slate-900 border-2 rounded-2xl text-center text-2xl font-black text-white focus:outline-none transition-all ${
              error ? 'border-red-500/50' : 'border-slate-800 focus:border-blue-500'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-xs text-center font-bold animate-pulse">{error}</p>}

      <InteractiveHoverButton 
        text={isVerifying ? "Verifying..." : "Verify Identity"}
        onClick={verifyOtp}
        disabled={otp.join('').length < 6 || isVerifying}
        className={otp.join('').length < 6 || isVerifying ? 'opacity-30' : ''}
      />

      <p className="text-center text-xs text-slate-500">
        Didn't receive it? <button className="text-blue-500 font-bold ml-1">Resend Code</button>
      </p>
    </div>
  );

  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center p-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-radial-gradient from-blue-600/20 via-transparent to-transparent blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 flex items-center justify-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter italic">Lingo<span className="text-blue-500">Social</span></h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
            Master languages through culture, reels, and real conversations.
          </p>
          <div className="w-full space-y-4">
            <InteractiveHoverButton text="Get Started" onClick={() => setStep(1)} />
            <button 
              onClick={() => setStep(1)}
              className="w-full bg-slate-900 text-slate-400 py-5 rounded-[2rem] font-bold text-sm border border-slate-800 hover:text-white transition-all"
            >
              I already have an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm h-full flex flex-col p-8 relative z-10">
        <div className="shrink-0 pt-8 mb-10">
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} 
              />
            ))}
          </div>
          {step > 2 && (
            <h1 className="text-4xl font-black text-white leading-tight tracking-tighter whitespace-pre-line">
              {step === 3 && "Verified!\nWhat's your name?"}
              {step === 4 && "What are we\nlearning?"}
              {step === 5 && "Where are you\nstarting?"}
            </h1>
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {step === 1 && renderEmailStep()}
          {step === 2 && renderOtpStep()}
          
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-2">Display Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-slate-800 py-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-4">Native Language</label>
                <div className="relative">
                  <select 
                    value={nativeLang}
                    onChange={(e) => setNativeLang(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-slate-900">{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 pb-4 custom-scrollbar animate-in fade-in duration-500">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTargetLang(lang)}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    targetLang === lang 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm">{lang}</span>
                </button>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {[LanguageLevel.BEGINNER, LanguageLevel.INTERMEDIATE, LanguageLevel.ADVANCED].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`w-full p-6 rounded-3xl text-left border transition-all flex items-center justify-between ${
                    level === l ? 'bg-white text-slate-950' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <span className="font-black text-lg block">{l}</span>
                  </div>
                  {level === l && <div className="bg-slate-950 text-white rounded-full p-1"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {step >= 3 && (
          <div className="shrink-0 pt-6 pb-8 bg-slate-950 border-t border-slate-900 mt-auto">
            <InteractiveHoverButton 
              text={step < 5 ? "Continue" : "Start My Journey"}
              onClick={step < 5 ? () => setStep(step + 1) : handleFinish}
              disabled={step === 3 ? !name.trim() : !targetLang}
              className={step === 3 && !name.trim() ? 'opacity-30' : ''}
            />
            <button 
              onClick={() => setStep(step - 1)}
              className="w-full py-4 text-slate-600 font-bold text-xs uppercase tracking-widest mt-2 hover:text-slate-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
