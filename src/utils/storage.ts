import { ChatThread, UserProfile, Message } from '../types';

const STORAGE_KEYS = {
  THREADS: 'luna_ai_threads',
  ACTIVE_THREAD_ID: 'luna_ai_active_thread_id',
  USER_PROFILE: 'luna_ai_user_profile',
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Aryan King',
  email: 'aryanking910926@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  plan: 'Luna Plus',
  customInstructions: 'Respond clearly and concisely with well-structured markdown and practical examples. Format all code cleanly.',
  aboutUser: 'Full-stack software engineer working with TypeScript, React, and generative AI models.',
  theme: 'light',
  soundEnabled: true,
  searchGroundingDefault: false,
  voiceGender: 'female',
};

export const INITIAL_WELCOME_THREAD: ChatThread = {
  id: 'welcome-thread-1',
  title: 'Welcome to Luna AI Official',
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 3600000,
  isPinned: true,
  modelId: 'gemini-2.5-flash',
  category: 'Today',
  messages: [
    {
      id: 'msg-welcome-user',
      role: 'user',
      content: 'Hello Luna! What can you do?',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'msg-welcome-asst',
      role: 'assistant',
      content: `Hello **Aryan**! Welcome to **Luna AI Official** — your clean, intelligent conversational AI assistant.

Here is what you can do:
- ⚡ **Multi-Model Intelligence**: Switch between **Luna 4o** (*gemini-2.5-flash*), **Luna 4o Pro** (*gemini-2.5-pro* for deep reasoning), and **Luna Mini** (*gemini-2.5-flash-lite* for lightning responses).
- 🎙️ **Voice & Speech**: Tap the microphone or voice button for spoken dictation and real-time speech.
- 🌐 **Web Search Grounding**: Ground your answers in live Google Search results with verified web links.
- 📎 **Multimodal Vision**: Attach images and photos for instant visual breakdown, code extraction, and reasoning.
- ☁️ **Cloud Synchronization**: Sign in with Google to automatically back up and sync your chats across devices.

How can I help you today?`,
      timestamp: Date.now() - 3590000,
      modelId: 'gemini-2.5-flash',
    },
  ],
};

export function loadThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THREADS);
    if (!raw) {
      const initial = [INITIAL_WELCOME_THREAD];
      saveThreads(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_WELCOME_THREAD];
  } catch {
    return [INITIAL_WELCOME_THREAD];
  }
}

export function saveThreads(threads: ChatThread[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
  } catch (err) {
    console.error('Failed to save threads', err);
  }
}

export function loadActiveThreadId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_THREAD_ID) || INITIAL_WELCOME_THREAD.id;
  } catch {
    return INITIAL_WELCOME_THREAD.id;
  }
}

export function saveActiveThreadId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THREAD_ID, id);
  } catch (err) {
    console.error('Failed to save active thread id', err);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROFILE,
      ...parsed,
      avatar:
        typeof parsed.avatar === 'string' && parsed.avatar.trim() !== ''
          ? parsed.avatar.trim()
          : DEFAULT_USER_PROFILE.avatar,
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function groupThreadsByDate(threads: ChatThread[]): Record<string, ChatThread[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 7 * 86400000;

  const groups: Record<string, ChatThread[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  threads.forEach((t) => {
    if (t.isPinned) {
      groups.Pinned.push(t);
      return;
    }

    const time = t.updatedAt || t.createdAt;
    if (time >= todayStart) {
      groups.Today.push(t);
    } else if (time >= yesterdayStart) {
      groups.Yesterday.push(t);
    } else if (time >= sevenDaysStart) {
      groups['Previous 7 Days'].push(t);
    } else {
      groups.Older.push(t);
    }
  });

  return groups;
}
