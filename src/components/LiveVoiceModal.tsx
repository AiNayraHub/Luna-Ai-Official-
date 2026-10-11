import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  RefreshCw,
  MessageSquare,
  PhoneOff,
} from 'lucide-react';
import { ModelId } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ModelId;
  onSendLiveTranscriptToChat: (userText: string, aiText: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSendLiveTranscriptToChat,
}) => {
  const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking' | 'idle'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastUserSpeech, setLastUserSpeech] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [showTranscriptLog, setShowTranscriptLog] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { sender: 'user' | 'luna'; text: string; time: string }[]
  >([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timeoutRef = useRef<any>(null);

  // Initialize Speech Recognition & Synthesis
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setStatus('idle');
      return;
    }

    synthRef.current = window.speechSynthesis;
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('idle');
      setLastAiResponse(
        'Speech recognition is not natively supported in this browser environment. You can use text prompts in the chat!'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentSpeech = finalTranscript || interimTranscript;
        setLiveTranscript(currentSpeech);

        if (finalTranscript.trim()) {
          processVoiceInput(finalTranscript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        if (status !== 'speaking' && status !== 'thinking') {
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        if (isOpen && status === 'listening' && !isMuted) {
          try {
            recognition.start();
          } catch (e) {
            console.error(e);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
    }
  };

  const processVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setStatus('thinking');
    setLastUserSpeech(spokenText);
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setConversationHistory((prev) => [
      ...prev,
      { sender: 'user', text: spokenText, time: now },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...conversationHistory.slice(-4).map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
            { role: 'user', content: spokenText },
          ],
          systemInstruction:
            'You are in Live Voice mode. Respond concisely in 1 to 2 spoken sentences. Speak naturally, warmly, and avoid markdown symbols, bullet points, or code formatting.',
          searchGrounding: false,
        }),
      });

      const data = await res.json();
      const answer =
        data.text ||
        "I'm here and listening. How can I assist you with your project today?";

      setLastAiResponse(answer);
      setConversationHistory((prev) => [
        ...prev,
        { sender: 'luna', text: answer, time: now },
      ]);

      speakAiResponse(answer);
    } catch (err) {
      console.error(err);
      const fallback =
        'I am listening. Feel free to speak or ask any question.';
      setLastAiResponse(fallback);
      speakAiResponse(fallback);
    }
  };

  const speakAiResponse = (text: string) => {
    setStatus('speaking');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.lang.startsWith('en')
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => {
        setStatus('listening');
        if (!isMuted) {
          startListening();
        }
      };

      utterance.onerror = () => {
        setStatus('listening');
        if (!isMuted) {
          startListening();
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setStatus('listening');
        if (!isMuted) {
          startListening();
        }
      }, 3000);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="live-voice-modal"
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 text-gray-900"
    >
      {/* Top Header - Compact for phone screens */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#10a37f]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm sm:text-base">
              Luna Voice Mode
            </div>
            <div className="text-[11px] text-gray-500">
              Live Conversational Audio
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTranscriptLog(!showTranscriptLog)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showTranscriptLog
                ? 'bg-emerald-50 text-[#10a37f] border border-emerald-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Transcript</span>
          </button>

          <button
            id="btn-close-live-voice"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Animated Ambient Breathing Orb - Sized nicely for phone */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full my-auto text-center px-4">
        {/* Dynamic Glowing Orb Container */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              status === 'speaking'
                ? 'bg-emerald-400/30 blur-2xl scale-125 animate-pulse'
                : status === 'thinking'
                ? 'bg-amber-400/20 blur-xl scale-110'
                : status === 'listening'
                ? 'bg-emerald-400/20 blur-2xl scale-100'
                : 'bg-gray-200/40 blur-lg scale-90'
            }`}
          />

          {/* Middle animated ring */}
          <div
            className={`absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-emerald-200 transition-all duration-700 ${
              status === 'speaking'
                ? 'border-[#10a37f]/60 scale-110 shadow-lg shadow-[#10a37f]/20'
                : status === 'thinking'
                ? 'border-amber-400/50 animate-spin duration-3000'
                : 'border-gray-200 animate-pulse'
            }`}
          />

          {/* Core Orb */}
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
              status === 'speaking'
                ? 'bg-gradient-to-br from-[#10a37f] to-[#0d8265] scale-105 shadow-emerald-500/30'
                : status === 'thinking'
                ? 'bg-gradient-to-br from-amber-500 to-emerald-600 scale-100 shadow-amber-500/20'
                : status === 'listening'
                ? 'bg-gradient-to-br from-[#10a37f] to-[#047857] scale-95 shadow-emerald-500/20'
                : 'bg-gray-300 scale-90'
            }`}
          >
            {status === 'speaking' ? (
              <div className="flex items-center gap-1 h-6">
                <div className="w-1 bg-white rounded-full animate-wave-1 h-4" />
                <div className="w-1 bg-white rounded-full animate-wave-2 h-6" />
                <div className="w-1 bg-white rounded-full animate-wave-3 h-5" />
                <div className="w-1 bg-white rounded-full animate-wave-4 h-6" />
                <div className="w-1 bg-white rounded-full animate-wave-5 h-3" />
              </div>
            ) : status === 'thinking' ? (
              <Sparkles className="w-8 h-8 text-white animate-spin duration-1500" />
            ) : status === 'listening' ? (
              <Mic className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <MicOff className="w-7 h-7 text-gray-500" />
            )}
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="mt-4 sm:mt-6">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === 'speaking'
                ? 'bg-emerald-50 text-[#10a37f] border border-emerald-200'
                : status === 'thinking'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : status === 'listening'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status === 'speaking'
              ? 'Luna Speaking...'
              : status === 'thinking'
              ? 'Thinking...'
              : status === 'listening'
              ? 'Listening to you...'
              : 'Microphone Paused'}
          </span>
        </div>

        {/* Live speech subtitles */}
        <div className="mt-3 min-h-[44px] max-w-sm">
          {liveTranscript ? (
            <p className="text-xs sm:text-sm text-gray-800 italic line-clamp-2">
              "{liveTranscript}"
            </p>
          ) : lastAiResponse ? (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              "{lastAiResponse}"
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Start speaking anytime. Luna will respond naturally.
            </p>
          )}
        </div>
      </div>

      {/* Transcript Log overlay (if toggled) */}
      {showTranscriptLog && (
        <div className="max-w-md mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-3 max-h-48 overflow-y-auto mb-3 text-xs space-y-2">
          <div className="font-bold text-gray-900 border-b border-gray-100 pb-1 flex items-center justify-between">
            <span>Session Transcript</span>
            <span className="text-[10px] text-gray-400 font-normal">
              {conversationHistory.length} turns
            </span>
          </div>
          {conversationHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl ${
                item.sender === 'user'
                  ? 'bg-gray-50 text-gray-900'
                  : 'bg-emerald-50/50 text-emerald-900 border border-emerald-100'
              }`}
            >
              <div className="font-bold text-[10px] text-gray-500 flex justify-between">
                <span>{item.sender === 'user' ? 'You' : 'Luna'}</span>
                <span>{item.time}</span>
              </div>
              <p className="mt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Phone-style Call Controls Bar */}
      <div className="max-w-sm mx-auto w-full flex items-center justify-center gap-4 sm:gap-6 py-2">
        {/* Mute/Unmute Mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-amber-50 text-amber-700 border border-amber-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="End Voice Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Send to chat thread */}
        <button
          onClick={() => {
            if (lastUserSpeech && lastAiResponse) {
              onSendLiveTranscriptToChat(lastUserSpeech, lastAiResponse);
            }
            onClose();
          }}
          className="w-12 h-12 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#10a37f] border border-emerald-200 flex items-center justify-center transition-all"
          title="Save transcript to chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
