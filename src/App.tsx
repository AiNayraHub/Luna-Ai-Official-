import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfirmModal } from './components/ConfirmModal';
import {
  ChatThread,
  Message,
  ModelId,
  UserProfile,
  Attachment,
} from './types';
import {
  loadThreads,
  saveThreads,
  loadActiveThreadId,
  saveActiveThreadId,
  loadUserProfile,
  saveUserProfile,
} from './utils/storage';
import {
  auth,
  testConnection,
  loginWithGoogle,
  logoutUser,
} from './firebase';
import {
  fetchCloudUserProfile,
  saveCloudUserProfile,
  saveCloudThread,
  deleteCloudThread,
  clearAllCloudThreads,
  subscribeToCloudThreads,
} from './utils/firebaseStorage';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { MODELS } from './data/constants';

export default function App() {
  // State for threads, active thread, user profile, and modals
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(() => loadActiveThreadId());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-2.5-flash');
  const [enableSearch, setEnableSearch] = useState<boolean>(false);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState<string | null>(null);

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default sidebar state: open on desktop, closed on phone
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  // Firebase connection test & Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const cloudProf = await fetchCloudUserProfile(currentUser.uid);
          if (cloudProf) {
            setUserProfile((prev) => ({
              ...prev,
              ...cloudProf,
              avatar:
                typeof cloudProf.avatar === 'string' && cloudProf.avatar.trim() !== ''
                  ? cloudProf.avatar.trim()
                  : prev.avatar,
              theme: 'light',
            }));
          } else {
            const initialCloud: UserProfile = {
              ...userProfile,
              name: currentUser.displayName || userProfile.name,
              email: currentUser.email || userProfile.email,
              avatar: (currentUser.photoURL && currentUser.photoURL.trim()) || userProfile.avatar,
              theme: 'light',
            };
            setUserProfile(initialCloud);
            await saveCloudUserProfile(currentUser.uid, initialCloud);
          }
        } catch (err) {
          console.error('Failed to sync user profile with Firebase', err);
        }

        const unsubThreads = subscribeToCloudThreads(currentUser.uid, (cloudThreads) => {
          if (cloudThreads && cloudThreads.length > 0) {
            setThreads(cloudThreads);
            saveThreads(cloudThreads);
            setActiveThreadId((currId) => {
              if (!cloudThreads.some((t) => t.id === currId)) {
                const nextId = cloudThreads[0].id;
                saveActiveThreadId(nextId);
                return nextId;
              }
              return currId;
            });
          } else {
            const fresh: ChatThread = {
              id: `thread-${Date.now()}`,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
              modelId: selectedModel,
            };
            setThreads([fresh]);
            setActiveThreadId(fresh.id);
            saveThreads([fresh]);
            saveActiveThreadId(fresh.id);
          }
        });

        return () => unsubThreads();
      }
    });

    return () => unsubscribe();
  }, [selectedModel]);

  // Sync with localStorage
  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  useEffect(() => {
    saveActiveThreadId(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    saveUserProfile({ ...userProfile, theme: 'light' });
  }, [userProfile]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0];

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages?.length, isLoading]);

  // Keyboard shortcut: Cmd+K / Ctrl+K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Profile & Sync to Firebase
  const handleUpdateProfile = (newProfile: UserProfile) => {
    const updated = { ...newProfile, theme: 'light' as const };
    setUserProfile(updated);
    if (firebaseUser) {
      saveCloudUserProfile(firebaseUser.uid, updated).catch((err) =>
        console.error('Failed to sync profile to cloud:', err)
      );
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        setFirebaseUser(user);
        const existingProf = await fetchCloudUserProfile(user.uid);
        if (existingProf) {
          setUserProfile((prev) => ({
            ...prev,
            ...existingProf,
            avatar:
              typeof existingProf.avatar === 'string' && existingProf.avatar.trim() !== ''
                ? existingProf.avatar.trim()
                : prev.avatar,
            theme: 'light',
          }));
        } else {
          const freshProf: UserProfile = {
            ...userProfile,
            name: user.displayName || userProfile.name,
            email: user.email || userProfile.email,
            avatar: (user.photoURL && user.photoURL.trim()) || userProfile.avatar,
            theme: 'light',
          };
          setUserProfile(freshProf);
          await saveCloudUserProfile(user.uid, freshProf);
        }
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
      setFirebaseUser(null);
    } catch (error) {
      console.error('Google Sign Out Error:', error);
    }
  };

  // Create New Chat Thread
  const handleNewChat = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModel,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    if (firebaseUser) {
      saveCloudThread(firebaseUser.uid, newThread);
    }
  };

  // Delete Chat Thread
  const handleDeleteThread = (id: string) => {
    if (firebaseUser) {
      deleteCloudThread(id).catch((err) =>
        console.error('Error deleting cloud thread:', err)
      );
    }
    const remaining = threads.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      const fresh: ChatThread = {
        id: `thread-${Date.now()}`,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: selectedModel,
      };
      if (firebaseUser) {
        saveCloudThread(firebaseUser.uid, fresh).catch((err) =>
          console.error('Error saving fresh thread:', err)
        );
      }
      setThreads([fresh]);
      setActiveThreadId(fresh.id);
      saveThreads([fresh]);
      saveActiveThreadId(fresh.id);
    } else {
      setThreads(remaining);
      saveThreads(remaining);
      if (activeThreadId === id) {
        const nextId = remaining[0].id;
        setActiveThreadId(nextId);
        saveActiveThreadId(nextId);
      }
    }
  };

  // Rename Chat Thread
  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, title: newTitle, updatedAt: Date.now() };
          if (firebaseUser) {
            saveCloudThread(firebaseUser.uid, updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Toggle Pin Thread
  const handleTogglePinThread = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, isPinned: !t.isPinned, updatedAt: Date.now() };
          if (firebaseUser) {
            saveCloudThread(firebaseUser.uid, updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Clear all chats execution
  const handleClearAllChats = async () => {
    if (firebaseUser) {
      await clearAllCloudThreads(firebaseUser.uid).catch((err) =>
        console.error('Error clearing cloud threads:', err)
      );
    }
    const fresh: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModel,
    };
    if (firebaseUser) {
      saveCloudThread(firebaseUser.uid, fresh).catch((err) =>
        console.error('Error saving fresh cloud thread:', err)
      );
    }
    setThreads([fresh]);
    setActiveThreadId(fresh.id);
    saveThreads([fresh]);
    saveActiveThreadId(fresh.id);
  };

  // Prompt Clear All Chats (Using safe In-App modal)
  const handlePromptClearAllChats = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete all chat history?',
      description:
        'This will permanently remove all of your conversations and messages. This action cannot be undone.',
      confirmLabel: 'Clear All',
      onConfirm: () => handleClearAllChats(),
    });
  };

  // Prompt Delete Current Chat (Using safe In-App modal)
  const handlePromptDeleteCurrentChat = () => {
    if (!activeThread) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete "${activeThread.title || 'this chat'}"?`,
      description:
        'This will permanently delete this conversation and all of its messages. This action cannot be undone.',
      confirmLabel: 'Delete Chat',
      onConfirm: () => handleDeleteThread(activeThread.id),
    });
  };

  // Delete Individual Message
  const handleDeleteMessage = (threadId: string, messageId: string) => {
    setThreads((prev) => {
      const updatedThreads = prev.map((t) => {
        if (t.id === threadId) {
          const updatedMessages = t.messages.filter((m) => m.id !== messageId);
          const updated = {
            ...t,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
          if (firebaseUser) {
            saveCloudThread(firebaseUser.uid, updated).catch((err) =>
              console.error('Error saving message delete to cloud:', err)
            );
          }
          return updated;
        }
        return t;
      });
      saveThreads(updatedThreads);
      return updatedThreads;
    });
  };

  // Send Message
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = []
  ) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
    };

    let currentThread = activeThread;
    if (!currentThread) {
      currentThread = {
        id: `thread-${Date.now()}`,
        title: text.slice(0, 30) || 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: selectedModel,
      };
      setThreads((prev) => [currentThread!, ...prev]);
      setActiveThreadId(currentThread.id);
    }

    // Auto title if first message
    const shouldUpdateTitle =
      currentThread.messages.length === 0 &&
      (currentThread.title === 'New Chat' || currentThread.title === 'Welcome to Luna AI Official');
    const newTitle = shouldUpdateTitle
      ? text.slice(0, 35) + (text.length > 35 ? '...' : '')
      : currentThread.title;

    const updatedMessages = [...currentThread.messages, userMessage];

    // Optimistically update thread
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentThread.id
          ? {
              ...t,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : t
      )
    );

    setIsLoading(true);

    try {
      let sysInstruction = `You are Luna AI, an intelligent, helpful, and friendly AI assistant. Always respond with clean markdown, well-formatted code blocks, and direct answers.`;
      if (userProfile.aboutUser) {
        sysInstruction += `\nUser Context: ${userProfile.aboutUser}`;
      }
      if (userProfile.customInstructions) {
        sysInstruction += `\nInstructions: ${userProfile.customInstructions}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          modelId: selectedModel,
          systemInstruction: sysInstruction,
          enableSearch,
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        content:
          data.text ||
          'I apologize, but I encountered an issue processing your request. Please try again.',
        timestamp: Date.now(),
        modelId: selectedModel,
        sources: data.sources || data.groundingSources || [],
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === currentThread.id) {
            const updated = {
              ...t,
              updatedAt: Date.now(),
              messages: finalMessages,
            };
            if (firebaseUser) {
              saveCloudThread(firebaseUser.uid, updated);
            }
            return updated;
          }
          return t;
        })
      );
    } catch (err: any) {
      console.error('Chat error', err);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: Unable to connect to Luna AI. Please verify your connection or try again.`,
        timestamp: Date.now(),
        modelId: selectedModel,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === currentThread.id
            ? {
                ...t,
                messages: [...updatedMessages, errorMessage],
              }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = async (msgId: string) => {
    if (!activeThread || isLoading) return;
    const msgIndex = activeThread.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const previousMessages = activeThread.messages.slice(0, msgIndex);
    if (previousMessages.length === 0) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: previousMessages,
          modelId: selectedModel,
          systemInstruction:
            'You are Luna AI, an intelligent, helpful, and friendly AI assistant. Always respond with clean markdown, well-formatted code blocks, and direct answers.',
          enableSearch,
        }),
      });

      const data = await res.json();
      const updatedAsstMessage: Message = {
        id: msgId,
        role: 'assistant',
        content: data.text || 'Failed to generate new response.',
        timestamp: Date.now(),
        modelId: selectedModel,
        sources: data.sources || data.groundingSources || [],
      };

      const updatedMessages = [
        ...previousMessages,
        updatedAsstMessage,
        ...activeThread.messages.slice(msgIndex + 1),
      ];

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === activeThread.id) {
            const updated = {
              ...t,
              updatedAt: Date.now(),
              messages: updatedMessages,
            };
            if (firebaseUser) {
              saveCloudThread(firebaseUser.uid, updated);
            }
            return updated;
          }
          return t;
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Rate Message (Thumbs Up / Down)
  const handleRateMessage = (msgId: string, liked: boolean) => {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === msgId
                  ? {
                      ...m,
                      liked: liked ? !m.liked : false,
                      disliked: !liked ? !m.disliked : false,
                    }
                  : m
              ),
            }
          : t
      )
    );
  };

  // Play TTS (Read Aloud)
  const handlePlayTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setCurrentPlayingAudioId(null);
        return;
      }

      const cleanText = text.replace(/```[\s\S]*?```/g, 'Code snippet.').slice(0, 1000);
      const utterance = new SpeechSynthesisUtterance(cleanText);
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
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setCurrentPlayingAudioId(text);
      utterance.onend = () => setCurrentPlayingAudioId(null);
      utterance.onerror = () => setCurrentPlayingAudioId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Send Transcript from Live Voice to Main Chat
  const handleSendLiveTranscriptToChat = (userText: string, aiText: string) => {
    if (!activeThread) return;
    const userMsg: Message = {
      id: `msg-live-user-${Date.now()}`,
      role: 'user',
      content: `🎙️ ${userText}`,
      timestamp: Date.now() - 1000,
    };
    const asstMsg: Message = {
      id: `msg-live-asst-${Date.now()}`,
      role: 'assistant',
      content: aiText,
      timestamp: Date.now(),
      modelId: selectedModel,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, userMsg, asstMsg] }
          : t
      )
    );
  };

  const currentModelInfo =
    MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div
      id="luna-app-root"
      className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] flex flex-col bg-white text-gray-900 overflow-hidden font-sans"
    >
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar Drawer */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => setActiveThreadId(id)}
          onNewChat={handleNewChat}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          onTogglePinThread={handleTogglePinThread}
          onClearAllChats={handlePromptClearAllChats}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          firebaseUser={firebaseUser}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Top Header */}
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedModel={selectedModel}
            onSelectModel={(m) => setSelectedModel(m)}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onNewChat={handleNewChat}
            activeThread={activeThread}
            onDeleteCurrentChat={handlePromptDeleteCurrentChat}
            onClearAllChats={handlePromptClearAllChats}
            enableSearch={enableSearch}
            onToggleSearch={() => setEnableSearch(!enableSearch)}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            firebaseUser={firebaseUser}
            onGoogleLogin={handleGoogleLogin}
            onGoogleLogout={handleGoogleLogout}
          />

          {/* Chat Messages Stream / Welcome Greeting */}
          <div
            id="chat-messages-scroll"
            className="flex-1 overflow-y-auto min-h-0 bg-white"
          >
            {activeThread && activeThread.messages.length > 0 ? (
              <div className="divide-y divide-gray-100/70">
                {activeThread.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRegenerate={() => handleRegenerate(message.id)}
                    onRate={(liked) => handleRateMessage(message.id, liked)}
                    onPlayTTS={handlePlayTTS}
                    isCurrentPlayingAudio={
                      currentPlayingAudioId === message.content
                    }
                    onDelete={() =>
                      handleDeleteMessage(activeThread.id, message.id)
                    }
                    userProfile={userProfile}
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="py-4 px-3 sm:px-6 bg-gray-50/70 border-y border-gray-100 animate-pulse">
                    <div className="max-w-3xl mx-auto flex gap-3 items-center">
                      <div className="w-7 h-7 rounded-full bg-[#10a37f] text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="font-semibold text-[#10a37f]">
                          {currentModelInfo.name}
                        </span>
                        <span>is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Empty State - Sized for mobile phone and desktop */
              <div className="h-full max-w-xl mx-auto flex flex-col justify-center items-center px-4 py-6 text-center space-y-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#10a37f] to-[#0a664e] flex items-center justify-center text-white shadow-md shadow-[#10a37f]/20">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    What can I help with today?
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Powered by{' '}
                    <span className="text-[#10a37f] font-bold">
                      {currentModelInfo.name}
                    </span>{' '}
                    — {currentModelInfo.tagline}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Pill Chat Input Bar */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
            enableSearch={enableSearch}
            onToggleSearch={() => setEnableSearch(!enableSearch)}
          />
        </div>
      </div>

      {/* Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        selectedModel={selectedModel}
        onSendLiveTranscriptToChat={handleSendLiveTranscriptToChat}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        selectedModel={selectedModel}
        onSelectModel={(m) => setSelectedModel(m)}
        threads={threads}
        onClearAllChats={handlePromptClearAllChats}
        firebaseUser={firebaseUser}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        firebaseUser={firebaseUser}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
      />

      {/* Safe In-App Confirmation Modal (no browser window.confirm in iframes) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
      />
    </div>
  );
}
