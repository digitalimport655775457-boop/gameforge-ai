export interface UserProfile {
  name: string;
  email: string;
  uid?: string;
  photoURL?: string;
  isGuest?: boolean;
}

export type ProjectType = 'app' | 'website' | 'platform' | 'game';

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  features?: string[];
  suggestedPrompts?: string[];
  projectTitle?: string;
  projectType?: ProjectType;
}

export interface GeneratedProject {
  id: string;
  title: string;
  type: ProjectType;
  description: string;
  code: string;
  features: string[];
  updatedAt: string;
  updatedAtTimestamp?: number;
  createdAtTimestamp?: number;
  isStarred?: boolean;
  conversation?: Array<{ role: 'user' | 'assistant'; text: string; time: string }>;
}

export interface QuickPrompt {
  id: string;
  category: ProjectType;
  categoryName?: string;
  categoryNameAr?: string;
  icon: string;
  title: string;
  titleAr?: string;
  prompt: string;
  promptAr?: string;
}

