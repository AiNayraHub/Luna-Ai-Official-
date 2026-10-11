import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  ExternalLink,
  Search,
  Trash2,
} from 'lucide-react';
import { Message, UserProfile } from '../types';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onPlayTTS?: (text: string) => void;
  isCurrentPlayingAudio?: boolean;
  onRate?: (liked: boolean) => void;
  onDelete?: () => void;
  userProfile?: UserProfile;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onPlayTTS,
  isCurrentPlayingAudio,
  onRate,
  onDelete,
  userProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [codeCopiedIndex, setCodeCopiedIndex] = useState<number | null>(null);

  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCodeCopiedIndex(index);
    setTimeout(() => setCodeCopiedIndex(null), 2000);
  };

  return (
    <div
      className={`w-full transition-colors py-3 sm:py-4 px-2.5 sm:px-4 ${
        isUser ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-2.5 sm:gap-3.5">
        {/* Role Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              {userProfile?.avatar && userProfile.avatar.trim() ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                userProfile?.name?.charAt(0) || 'U'
              )}
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header row with role name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs sm:text-sm text-gray-900 tracking-tight">
              {isUser ? userProfile?.name || 'You' : 'Luna AI'}
            </span>
            {!isUser && message.modelId && (
              <span className="text-[10px] text-gray-400 font-medium">
                {message.modelId.replace('gemini-', '')}
              </span>
            )}
          </div>

          {/* User Attachments (Images) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2">
              {message.attachments.map((att) => (
                att.dataUrl && att.dataUrl.trim() ? (
                  <div
                    key={att.id}
                    className="rounded-xl overflow-hidden border border-gray-200 shadow-2xs max-w-xs"
                  >
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="max-h-60 object-contain rounded-xl bg-gray-50"
                    />
                  </div>
                ) : null
              ))}
            </div>
          )}

          {/* User Message Bubble or Assistant Markdown */}
          {isUser ? (
            <div className="group/user-msg flex items-center gap-2">
              <div className="inline-block bg-gray-100 text-gray-900 text-sm sm:text-base px-3.5 py-2 rounded-2xl rounded-tl-sm font-normal max-w-full break-words">
                {message.content}
              </div>
              {onDelete && (
                <button
                  id={`btn-delete-user-msg-${message.id}`}
                  onClick={onDelete}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors opacity-100 sm:opacity-0 sm:group-hover/user-msg:opacity-100"
                  title="Delete message"
                  aria-label="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-gray-800 text-sm sm:text-base leading-relaxed space-y-3 break-words">
              {/* Accompanying Conversational Markdown Text */}
              {message.content && (
                <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-4 mb-2 pb-1 border-b border-gray-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-3 mb-1.5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-2 mb-1">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed text-gray-800 mb-2 last:mb-0">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-5 space-y-1 mb-2 text-gray-800">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-5 space-y-1 mb-2 text-gray-800">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#10a37f] pl-3 py-1 my-2 bg-emerald-50/40 text-gray-700 italic rounded-r">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => {
                    if (!href || typeof href !== 'string' || !href.trim()) {
                      return <span>{children}</span>;
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10a37f] hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        {children}
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    );
                  },
                  img: ({ src, alt, ...props }: any) => {
                    if (!src || typeof src !== 'string' || !src.trim()) {
                      return null;
                    }
                    return (
                      <img
                        src={src}
                        alt={alt || ''}
                        referrerPolicy="no-referrer"
                        className="rounded-xl max-w-full my-2 object-contain"
                        loading="lazy"
                        {...props}
                      />
                    );
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 border border-gray-200 rounded-xl shadow-2xs">
                      <table className="w-full text-xs sm:text-sm text-left text-gray-800 border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-100 text-gray-900 font-bold border-b border-gray-200 uppercase text-[11px] tracking-wider">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {children}
                    </tbody>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 border-r last:border-r-0 border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 border-r last:border-r-0 border-gray-200">
                      {children}
                    </td>
                  ),
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');

                    if (!inline && (match || codeText.includes('\n'))) {
                      const codeLang = match ? match[1] : 'code';
                      const codeIndex = Math.floor(Math.random() * 10000);
                      const isThisCodeCopied = codeCopiedIndex === codeIndex;

                      return (
                        <div className="my-3 rounded-xl overflow-hidden border border-gray-800 bg-[#0f172a] shadow-md">
                          {/* Code Block Header */}
                          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1e293b] text-gray-300 text-xs font-mono border-b border-gray-700/60">
                            <span className="font-semibold text-[11px] text-gray-400 uppercase tracking-wider">
                              {codeLang}
                            </span>
                            <button
                              onClick={() => handleCopyCode(codeText, codeIndex)}
                              className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-gray-700/60 transition-colors"
                              title="Copy code"
                            >
                              {isThisCodeCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#10a37f]" />
                                  <span className="text-[11px] text-[#10a37f]">
                                    Copied!
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Copy code</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Code Content */}
                          <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-gray-100 leading-relaxed">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="bg-gray-100 text-emerald-800 font-mono text-[13px] px-1.5 py-0.5 rounded border border-gray-200"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            </div>
          )}

          {/* Search Grounding Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                <Search className="w-3.5 h-3.5 text-[#10a37f]" />
                <span>Web Sources & Grounding</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-emerald-50/30 border border-gray-200 hover:border-[#10a37f]/50 transition-all group shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-[#10a37f] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {item.url}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#10a37f] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assistant Action Bar (Copy, Read Aloud, Feedback, Regenerate) */}
          {!isUser && (
            <div className="flex items-center gap-1 pt-2 text-gray-400">
              {/* Copy */}
              <button
                id={`btn-copy-msg-${message.id}`}
                onClick={handleCopyMessage}
                className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#10a37f]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Read Aloud TTS */}
              {onPlayTTS && (
                <button
                  id={`btn-tts-msg-${message.id}`}
                  onClick={() => onPlayTTS(message.content)}
                  className={`p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors ${
                    isCurrentPlayingAudio
                      ? 'text-[#10a37f] bg-emerald-50 animate-pulse'
                      : ''
                  }`}
                  title="Read aloud"
                >
                  {isCurrentPlayingAudio ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Thumbs Up */}
              {onRate && (
                <button
                  id={`btn-thumbsup-${message.id}`}
                  onClick={() => onRate(true)}
                  className={`p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors ${
                    message.liked ? 'text-[#10a37f] bg-emerald-50' : ''
                  }`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Thumbs Down */}
              {onRate && (
                <button
                  id={`btn-thumbsdown-${message.id}`}
                  onClick={() => onRate(false)}
                  className={`p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors ${
                    message.disliked ? 'text-red-500 bg-red-50' : ''
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Regenerate */}
              {onRegenerate && (
                <button
                  id={`btn-regenerate-${message.id}`}
                  onClick={onRegenerate}
                  className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete Message */}
              {onDelete && (
                <button
                  id={`btn-delete-msg-${message.id}`}
                  onClick={onDelete}
                  className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete message"
                  aria-label="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
