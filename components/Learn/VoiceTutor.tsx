
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { InteractiveHoverButton } from '../ui/InteractiveHoverButton';
import { Lesson } from '../../types';

interface VoiceTutorProps {
  targetLanguage: string;
  lesson: Lesson;
  onExit: () => void;
  onFinishPractice: () => void;
}

export const VoiceTutor: React.FC<VoiceTutorProps> = ({ targetLanguage, lesson, onExit, onFinishPractice }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [userTranscription, setUserTranscription] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Helper functions for audio processing
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> => {
    // Safe typed array construction
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Browsers require resumption after initialization often
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();
        
        audioContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Prepare context for the tutor
        const vocabList = lesson.content.vocabulary.map(v => `${v.word} (${v.translation})`).join(', ');
        const storyText = lesson.content.story?.map(s => s.text).join(' ') || 'No story provided.';

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: `You are 'Zephyr', a world-class ${targetLanguage} language tutor specializing in immersion. 
            The student just finished a reading lesson on: "${lesson.title}".
            
            Lesson Context for reference:
            - Vocabulary: ${vocabList}
            - Story Content: ${storyText}
            
            YOUR PROTOCOL:
            1. START: Greet them warmly in ${targetLanguage} and introduce yourself.
            2. INTERACTION: Ask exactly ONE engaging question in ${targetLanguage} about the story or the vocabulary mentioned above.
            3. ANALYSIS: Listen carefully. If the student makes a grammatical or pronunciation mistake in ${targetLanguage}, gently correct them in English first, explain why, then have them repeat the correct form in ${targetLanguage}.
            4. DYNAMICS: Keep your spoken segments short and punchy. Focus on getting the student to talk as much as possible.
            5. GOAL: Make them feel confident using the words they just learned.
            
            Proceed to greet them and ask your first question.`
          },
          callbacks: {
            onopen: () => {
              setStatus('listening');
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then(s => s.sendRealtimeInput({ 
                  media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
            },
            onmessage: async (msg) => {
              if (msg.serverContent?.outputTranscription) {
                setTranscription(prev => prev + msg.serverContent.outputTranscription.text);
              }
              if (msg.serverContent?.inputTranscription) {
                setUserTranscription(prev => prev + msg.serverContent.inputTranscription.text);
              }

              const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioBase64 && outputContextRef.current) {
                setStatus('speaking');
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), outputContextRef.current, 24000);
                const source = outputContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(outputContextRef.current.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('listening');
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setTranscription('');
                setUserTranscription('');
              }
            },
            onclose: () => onExit(),
            onerror: () => setStatus('error')
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (e) {
        console.error("Voice Tutor Initialization Failed:", e);
        setStatus('error');
      }
    };

    initSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outputContextRef.current) outputContextRef.current.close();
    };
  }, [targetLanguage, lesson]);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-blue-600/10 via-slate-950 to-slate-950 blur-[100px] transition-all duration-1000 ${status === 'speaking' ? 'opacity-40 scale-110' : 'opacity-20 scale-100'}`} />
      
      <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-20">
        <button onClick={onExit} className="p-3 glass rounded-full text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-full border border-white/5">
          <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-green-500 animate-pulse' : status === 'speaking' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-700'}`} />
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-300">{status}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm relative z-10">
        <div className="relative mb-12">
           <div className={`absolute -inset-16 bg-blue-600/20 rounded-full blur-3xl transition-all duration-700 ${status === 'speaking' ? 'scale-125 opacity-100' : 'scale-90 opacity-0'}`} />
           
           <div className={`relative w-44 h-44 rounded-full border flex items-center justify-center glass overflow-hidden transition-all duration-500 ${status === 'speaking' ? 'border-blue-500 scale-105' : 'border-slate-800'}`}>
              <div className="flex items-end gap-1.5 h-12 relative">
                 {[...Array(8)].map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-2 rounded-full transition-all duration-200 ${
                       status === 'speaking' ? 'bg-blue-400' : 
                       status === 'listening' ? 'bg-emerald-400/30' : 'bg-slate-800'
                     }`} 
                     style={{ 
                        height: status === 'speaking' ? `${40 + Math.random() * 60}%` : status === 'listening' ? `${10 + Math.random() * 20}%` : '8px', 
                        transitionDelay: `${i * 0.05}s` 
                     }}
                   />
                 ))}
              </div>
           </div>
        </div>

        <div className="mb-8">
           <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Zephyr AI</h2>
           <p className="text-blue-400 font-bold tracking-[0.15em] uppercase text-[10px] bg-blue-500/10 px-5 py-2 rounded-full inline-block border border-blue-500/20">
              {targetLanguage} Mastery Tutor
           </p>
        </div>

        <div className="w-full min-h-[160px] glass-card p-6 rounded-3xl mb-8 flex flex-col justify-start items-center border border-white/5 relative group">
           <button 
             onClick={() => setShowTranslation(!showTranslation)}
             className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
           >
             {showTranslation ? 'Hide Help' : 'Need Help?'}
           </button>

           <div className="w-full space-y-5 py-2">
              {userTranscription ? (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <span className="text-[9px] uppercase font-black text-slate-600 mb-2 tracking-widest">Studying Your Speech...</span>
                   <p className="text-slate-300 text-sm font-medium leading-relaxed italic">"{userTranscription}"</p>
                </div>
              ) : null}

              {transcription ? (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <span className="text-[9px] uppercase font-black text-blue-500 mb-2 tracking-widest">Zephyr is Speaking</span>
                   <p className="text-white text-lg font-bold leading-tight tracking-tight">{transcription}</p>
                   {showTranslation && (
                     <p className="mt-2 text-slate-500 text-xs italic animate-in fade-in duration-700">
                       [ AI is providing feedback and asking about the {lesson.title} ]
                     </p>
                   )}
                </div>
              ) : null}

              {!transcription && !userTranscription && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                   <p className="text-xs font-medium animate-pulse">
                     {status === 'connecting' ? 'Establishing secure neural link...' : 
                      status === 'listening' ? 'Waiting for your voice...' : 
                      'Thinking...'}
                   </p>
                </div>
              )}
           </div>
        </div>

        <div className="flex flex-col w-full gap-4">
          <div className="flex justify-center gap-6">
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className={`p-6 rounded-[2.5rem] border transition-all transform active:scale-90 shadow-xl ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
             >
               {isMuted ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 </svg>
               )}
             </button>
          </div>
          
          <div className="pt-6">
             <InteractiveHoverButton 
               text="Complete Practice Session" 
               onClick={onFinishPractice}
               className="border-slate-800 bg-slate-900/50 hover:bg-slate-900"
             />
             <p className="mt-4 text-[10px] font-black uppercase text-slate-600 tracking-widest">Session ends automatically on disconnect</p>
          </div>
        </div>
      </div>
    </div>
  );
};
