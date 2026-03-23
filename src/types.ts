import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isPremium?: boolean;
  createdAt: Timestamp;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  markup: string | null;
  embeddings?: number[];
  tags: string[];
  isVoiceNote: boolean;
  audioUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
