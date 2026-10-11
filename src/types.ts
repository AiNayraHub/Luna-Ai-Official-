export type ModelId = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';

export interface ModelOption {
  id: ModelId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  icon: string;
  speed: 'Fast' | 'Ultra Fast' | 'Deep Thinker';
  intelligence: 'High' | 'Very High' | 'Maximum';
  contextWindow: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  dataUrl: string; // base64
  size?: number;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: ModelId;
  attachments?: Attachment[];
  groundingSources?: GroundingSource[];
  sources?: GroundingSource[];
  isStreaming?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  modelId: ModelId;
  category?: 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  plan: 'Luna Plus' | 'Luna Free' | 'Luna Pro';
  customInstructions: string;
  aboutUser: string;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  searchGroundingDefault: boolean;
  voiceGender: 'female' | 'male';
}
