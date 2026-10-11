import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Plus,
  Globe,
  Mic,
  MicOff,
  Radio,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Code,
  X,
} from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onOpenLiveVoice: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onOpenLiveVoice,
  enableSearch,
  onToggleSearch,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListeningSTT, setIsListeningSTT] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // Click outside to close plus menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(e.target as Node)
      ) {
        setIsPlusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle File Upload (Photos / Images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: 'image',
          mimeType: file.type,
          dataUrl,
          size: file.size,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsPlusMenuOpen(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Web Speech API for STT (Dictation)
  const toggleSTT = () => {
    if (isListeningSTT) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningSTT(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech dictation is not available in this browser. You can use the Voice Mode button!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSTT(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListeningSTT(false);
      };

      recognition.onend = () => {
        setIsListeningSTT(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListeningSTT(false);
    }
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-2.5 sm:px-4 pb-2.5 sm:pb-3 pt-1 bg-white">
      {/* Hidden File Input for Image attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-2xl border border-gray-200 shadow-2xs">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group rounded-xl overflow-hidden border border-gray-300 bg-white w-14 h-14 sm:w-16 sm:h-16 shadow-xs"
            >
              {att.dataUrl && att.dataUrl.trim() ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <button
                onClick={() => handleRemoveAttachment(att.id)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pill-shaped Floating Chat Bar in Clean White Theme */}
      <div
        id="chat-input-box"
        className="relative bg-white border border-gray-300 hover:border-gray-400 focus-within:border-[#10a37f] focus-within:ring-2 focus-within:ring-[#10a37f]/20 rounded-[24px] sm:rounded-[28px] shadow-sm hover:shadow-md transition-all p-1.5 sm:p-2 flex flex-col gap-1"
      >
        {/* Textarea */}
        <div className="px-2 pt-1">
          <textarea
            id="chat-textarea"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Luna AI..."
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm sm:text-base resize-none outline-none max-h-40 leading-relaxed font-medium"
          />
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          {/* Left tools: Plus menu, Web search */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Multimodal Plus (+) Menu */}
            <div className="relative" ref={plusMenuRef}>
              <button
                id="btn-input-plus"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach photo or prompt starter"
              >
                <Plus className="w-4 h-4" />
              </button>

              {isPlusMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-gray-800">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setInput('Explain this concept simply: ');
                      textareaRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-emerald-50/70 rounded-xl transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4 text-[#10a37f]" />
                    <span>Explain Concept</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setInput('Write a clean TypeScript solution for: ');
                      textareaRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Code className="w-4 h-4 text-indigo-600" />
                    <span>Code Generation</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      setInput('Write a creative story about: ');
                      textareaRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Creative Writing</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Upload Image / Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onToggleSearch();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>
                      {enableSearch ? 'Disable Search' : 'Search with Google'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Google Search Grounding Toggle */}
            <button
              id="btn-input-websearch"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                enableSearch
                  ? 'bg-emerald-50 text-[#10a37f] border border-emerald-200'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={
                enableSearch
                  ? 'Google Search Grounding: ON'
                  : 'Enable Google Search'
              }
            >
              <Globe
                className={`w-3.5 h-3.5 ${
                  enableSearch ? 'text-[#10a37f]' : ''
                }`}
              />
              <span className="text-[11px] font-bold hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Right tools: STT Mic, Voice Orb, or Send Button */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Dictation / Speech-to-Text */}
            <button
              id="btn-input-stt"
              onClick={toggleSTT}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                isListeningSTT
                  ? 'text-red-500 bg-red-50 animate-pulse'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isListeningSTT ? 'Stop listening' : 'Dictate with voice'}
            >
              {isListeningSTT ? (
                <MicOff className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Voice Mode Orb when empty, OR Circular Send Arrow when typing */}
            {hasContent ? (
              <button
                id="btn-send-message"
                onClick={handleSend}
                disabled={isLoading}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10a37f] hover:bg-[#0d8265] text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-40"
                title="Send message"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            ) : (
              <button
                id="btn-input-voice-orb"
                onClick={onOpenLiveVoice}
                className="p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all text-[#10a37f]"
                title="Open Voice Mode"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-1 sm:mt-1.5">
        <span className="text-[10px] sm:text-[11px] text-gray-400">
          Luna AI can make mistakes. Verify important info.
        </span>
      </div>
    </div>
  );
};
