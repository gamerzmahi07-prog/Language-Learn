
import React, { useState, useRef } from 'react';
import { Lesson } from '../../types';
import { VoiceTutor } from './VoiceTutor';
import { speakText } from '../../services/geminiService';
import { InteractiveHoverButton } from '../ui/InteractiveHoverButton';

interface LessonPlayerProps {
  lesson: Lesson;
  targetLanguage: string;
  onComplete: () => void;
  onExit: () => void;
}

const SpeakerIcon = ({ active }: { active: boolean }) => (
  <div className={`p-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
    {active ? (
      <div className="flex items-end gap-0.5 h-4 w-4">
        <div className="w-1 h-full bg-white animate-bounce" style={{animationDelay: '0s'}} />
        <div className="w-1 h-2/3 bg-white animate-bounce" style={{animationDelay: '0.1s'}} />
        <div className="w-1 h-full bg-white animate-bounce" style={{animationDelay: '0.2s'}} />
      </div>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
      </svg>
    )}
  </div>
);

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lesson, targetLanguage, onComplete, onExit }) => {
  const [step, setStep] = useState<'content' | 'practice-intro' | 'voice' | 'quiz'>('content');
  const [contentSubStep, setContentSubStep] = useState(0); // 0: Vocab, 1: Phrases, 2: Dialogue, 3: Story
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const quiz = lesson.quiz || [];
  const currentQuestion = quiz[quizIdx];
  const hasQuiz = quiz.length > 0;

  const playAudio = async (text: string, id: string) => {
    if (speakingId) return;
    setSpeakingId(id);

    try {
      const base64Audio = await speakText(text, targetLanguage);
      if (!base64Audio) throw new Error("No audio data");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      // Safe construction from typed array buffer
      const dataInt16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setSpeakingId(null);
      source.start();
    } catch (e) {
      console.error("TTS Playback failed:", e);
      setSpeakingId(null);
    }
  };

  const handleNextContent = () => {
    const maxSubSteps = lesson.content.story ? 3 : 2;
    if (contentSubStep < maxSubSteps) {
      setContentSubStep(contentSubStep + 1);
      const scrollArea = document.getElementById('content-scroll-area');
      if (scrollArea) scrollArea.scrollTop = 0;
    } else {
      setStep('practice-intro');
    }
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null || !currentQuestion) return;
    
    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    setTimeout(() => {
      if (quizIdx + 1 < quiz.length) {
        setQuizIdx(quizIdx + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        onComplete();
      }
    }, 1200);
  };

  if (step === 'voice') {
    return (
      <VoiceTutor 
        targetLanguage={targetLanguage} 
        lesson={lesson} 
        onExit={() => setStep('content')} 
        onFinishPractice={() => {
          if (hasQuiz) setStep('quiz');
          else onComplete();
        }}
      />
    );
  }

  if (step === 'practice-intro') {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-radial-gradient from-blue-600/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
        <div className="max-w-xs w-full text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 flex items-center justify-center mb-8 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Ready for Spoken Practice?</h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
            Zephyr AI is ready to chat about your lesson. Practice speaking {targetLanguage} in a safe, real-time environment.
          </p>
          <div className="space-y-4">
            <InteractiveHoverButton text="Start Speaking Practice" onClick={() => setStep('voice')} />
            <button 
              onClick={() => setStep(hasQuiz ? 'quiz' : 'content')}
              className="w-full text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-all"
            >
              Skip to Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contentStages = [
    { id: 'vocab', label: 'Flashcards', color: 'blue' },
    { id: 'phrases', label: 'Expressions', color: 'purple' },
    { id: 'dialogue', label: 'Context', color: 'emerald' },
    ...(lesson.content.story ? [{ id: 'story', label: 'Reading', color: 'amber' }] : [])
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden">
      <div className="w-full max-w-md mx-auto h-full flex flex-col p-6">
        <header className="flex items-center justify-between mb-6 shrink-0">
          <button 
            onClick={onExit} 
            className="p-2 glass rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 mx-4 flex gap-1 items-center">
             {step === 'content' ? (
                contentStages.map((stage, idx) => (
                   <div 
                      key={stage.id} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx <= contentSubStep ? `bg-${stage.color}-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]` : 'bg-slate-800'}`}
                   />
                ))
             ) : (
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((quizIdx + 1) / quiz.length) * 100}%` }} />
                </div>
             )}
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{step}</span>
        </header>

        {step === 'content' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div id="content-scroll-area" className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 mb-6 animate-in fade-in slide-in-from-right-4 duration-500" key={contentSubStep}>
              
              <div className="shrink-0">
                <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                  {contentSubStep === 0 && "Step 1: The Basics"}
                  {contentSubStep === 1 && "Step 2: Expressions"}
                  {contentSubStep === 2 && "Step 3: Conversation"}
                  {contentSubStep === 3 && "Step 4: Immersive Reading"}
                </h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-6">
                  {contentSubStep === 0 && "Master essential terms"}
                  {contentSubStep === 1 && "Key phrases for daily life"}
                  {contentSubStep === 2 && "Natural context for your learning"}
                  {contentSubStep === 3 && "Read and listen to the flow"}
                </p>
              </div>

              {contentSubStep === 0 && (
                <div className="grid gap-3">
                  {lesson.content.vocabulary.map((v, i) => (
                    <button 
                      key={`vocab-${i}`}
                      onClick={() => playAudio(v.word, `vocab-${i}`)}
                      className={`glass-card p-4 rounded-2xl flex justify-between items-center border transition-all text-left ${
                        speakingId === `vocab-${i}` ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <SpeakerIcon active={speakingId === `vocab-${i}`} />
                        <div>
                          <p className="text-lg font-bold text-white tracking-tight">{v.word}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{v.translation}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter italic">[{v.pronunciation}]</span>
                    </button>
                  ))}
                </div>
              )}

              {contentSubStep === 1 && (
                <div className="grid gap-4">
                  {lesson.content.phrases.map((p, i) => (
                    <button 
                      key={`phrase-${i}`}
                      onClick={() => playAudio(p.phrase, `phrase-${i}`)}
                      className={`glass-card p-5 rounded-3xl flex items-center gap-4 border transition-all text-left ${
                        speakingId === `phrase-${i}` ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <SpeakerIcon active={speakingId === `phrase-${i}`} />
                      <div>
                        <p className="text-white font-bold text-lg leading-snug mb-1">{p.phrase}</p>
                        <p className="text-sm text-slate-500 font-medium">{p.translation}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {contentSubStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50 relative overflow-hidden">
                    <div className="space-y-6 relative z-10">
                      {lesson.content.dialogue.map((turn, i) => (
                        <div key={`turn-${i}`} className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{turn.speaker}</span>
                          </div>
                          <button 
                            onClick={() => playAudio(turn.text, `turn-${i}`)}
                            className={`max-w-[90%] p-4 rounded-2xl text-left transition-all relative flex items-start gap-3 ${
                              i % 2 === 0 
                                ? 'bg-slate-800 text-white rounded-bl-none' 
                                : 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30 rounded-br-none'
                            } ${speakingId === `turn-${i}` ? 'scale-[1.02] ring-2 ring-emerald-400' : ''}`}
                          >
                            <SpeakerIcon active={speakingId === `turn-${i}`} />
                            <div>
                              <p className="font-bold mb-1 leading-tight">{turn.text}</p>
                              <p className={`text-[10px] font-medium italic ${i % 2 === 0 ? 'text-slate-500' : 'text-emerald-200'}`}>{turn.translation}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {contentSubStep === 3 && lesson.content.story && (
                <div className="space-y-6 pb-4">
                  {lesson.content.story.map((para, i) => (
                    <button
                      key={`story-${i}`}
                      onClick={() => playAudio(para.text, `story-${i}`)}
                      className={`w-full text-left p-6 rounded-3xl glass-card border transition-all relative overflow-hidden group flex items-start gap-4 ${
                        speakingId === `story-${i}` ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800/50'
                      }`}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full bg-amber-500 transition-opacity ${speakingId === `story-${i}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                      <div className="shrink-0 mt-1">
                        <SpeakerIcon active={speakingId === `story-${i}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Part {i+1}</span>
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed mb-3">
                          {para.text}
                        </p>
                        <p className="text-slate-500 text-sm italic">
                          {para.translation}
                        </p>
                      </div>
                    </button>
                  ))}
                  <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Cultural Insight</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">"{lesson.content.culturalNote}"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 pt-4 pb-8 bg-slate-950 border-t border-slate-900">
              <InteractiveHoverButton 
                text={contentSubStep < (lesson.content.story ? 3 : 2) ? 'Next Lesson Stage' : 'Meet Your AI Voice Tutor'}
                onClick={handleNextContent}
                className={contentSubStep === (lesson.content.story ? 3 : 2) ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-950' : ''}
              />
              <p className="text-center text-[10px] text-slate-600 uppercase font-black tracking-widest mt-4">
                {contentSubStep < (lesson.content.story ? 3 : 2) ? 'Listen to all items to master pronunciation' : 'Conversational practice starts next'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-300">
            <div className="shrink-0 mb-6">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 block">Quiz Time • Question {quizIdx + 1} of {quiz.length}</span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{currentQuestion?.question}</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-1 custom-scrollbar">
              {currentQuestion?.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full text-left p-6 rounded-3xl border transition-all duration-200 transform active:scale-[0.98] ${
                    selectedOption === i ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800/50 glass-card text-slate-400 hover:border-slate-600'
                  } ${isCorrect !== null && i === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500/20 text-green-400' : ''}
                    ${isCorrect === false && selectedOption === i ? 'border-red-500 bg-red-500/20 text-red-400' : ''}
                  `}
                  disabled={isCorrect !== null}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${selectedOption === i ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-700 text-slate-500'}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className="font-bold tracking-tight">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="shrink-0 pt-4 pb-8 bg-slate-950 border-t border-slate-900">
              <InteractiveHoverButton 
                text={isCorrect === null ? 'Confirm Answer' : 'Continue'}
                disabled={selectedOption === null && isCorrect === null}
                onClick={handleQuizSubmit}
                className={selectedOption === null && isCorrect === null ? 'opacity-30 cursor-not-allowed' : ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
