import { ModelOption } from '../types';

export const MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Luna 4o',
    badge: 'DEFAULT',
    tagline: 'Fast & Intelligent Everyday Model',
    description: 'Our most balanced flagship model for smart reasoning, multi-turn chatting, analysis, and instant answers.',
    icon: 'Sparkles',
    speed: 'Fast',
    intelligence: 'High',
    contextWindow: '1M Tokens',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Luna 4o Pro',
    badge: 'PLUS',
    tagline: 'Deep Reasoning & Complex STEM',
    description: 'Advanced reasoning engine designed for complex mathematical proofs, deep architecture, coding, and difficult analysis.',
    icon: 'BrainCircuit',
    speed: 'Deep Thinker',
    intelligence: 'Maximum',
    contextWindow: '2M Tokens',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Luna Mini',
    badge: 'LIGHT',
    tagline: 'Lightweight & Ultra-Fast',
    description: 'Optimized for blazing responsiveness, simple summaries, quick translations, and low latency responses.',
    icon: 'Zap',
    speed: 'Ultra Fast',
    intelligence: 'High',
    contextWindow: '1M Tokens',
  },
];

