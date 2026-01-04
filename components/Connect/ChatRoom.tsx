
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../../types';

interface ChatRoomProps {
  peer: { name: string; avatar: string; lang: string };
  onBack: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ peer, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderId: 'peer', text: `¡Hola! ¿Cómo estás hoy?`, timestamp: Date.now() - 100000 }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
    setInputText('');

    // Mock auto-reply
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'peer',
        text: `That sounds interesting! Let's talk more in ${peer.lang}.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              parts: [
                { inlineData: { data: base64Data, mimeType: 'audio/webm' } },
                { text: `Transcribe this spoken message in ${peer.lang}. Only return the transcription, nothing else. If it sounds like filler, clean it up.` }
              ]
            }
          ]
        });

        const transcription = response.text || '';
        if (transcription) {
          setInputText(prev => (prev ? `${prev} ${transcription}` : transcription));
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Transcription failed", err);
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      <header className="shrink-0 p-4 border-b border-slate-900 glass flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            <img src={peer.avatar} className="w-10 h-10 rounded-full border border-slate-800" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-950" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-none mb-1">{peer.name}</h3>
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Chatting in {peer.lang}</span>
          </div>
        </div>
        <button className="text-slate-500 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[80%] p-4 rounded-3xl ${
              msg.senderId === 'me' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20' 
                : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              <p className={`text-[9px] mt-1 uppercase font-bold tracking-widest ${msg.senderId === 'me' ? 'text-blue-200' : 'text-slate-600'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTranscribing && (
           <div className="flex justify-start animate-pulse">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl rounded-bl-none">
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                 </div>
              </div>
           </div>
        )}
      </div>

      <footer className="shrink-0 p-4 bg-slate-950 border-t border-slate-900 pb-8">
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); }}}
              placeholder={isRecording ? "Listening..." : "Type or use AI voice..."}
              className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] py-4 pl-6 pr-14 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none max-h-32"
            />
            
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`absolute right-2 top-2 p-3 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'text-slate-500 hover:text-blue-400'
              }`}
            >
              {isRecording ? (
                <div className="flex items-center gap-1 h-5">
                   <div className="w-1 h-3 bg-white animate-pulse" />
                   <div className="w-1 h-5 bg-white animate-pulse" />
                   <div className="w-1 h-3 bg-white animate-pulse" />
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>

          <button 
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isRecording}
            className={`p-4 rounded-full transition-all ${
              inputText.trim() && !isRecording 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                : 'bg-slate-900 text-slate-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        {isRecording && (
          <p className="text-center text-[10px] font-black uppercase text-red-500 tracking-[0.2em] mt-3 animate-pulse">
            Recording audio in {peer.lang}...
          </p>
        )}
      </footer>
    </div>
  );
};
