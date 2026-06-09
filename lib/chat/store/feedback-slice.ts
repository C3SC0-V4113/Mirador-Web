import type { ChatStore } from '@/lib/chat/store';
import type { StateCreator } from 'zustand';

export interface FeedbackSlice {
  copiedMessageId: string | null;
  errorMessage: string;

  setCopied: (messageId: string | null) => void;
  setErrorMessage: (errorMessage: string) => void;
}

export const createFeedbackSlice: StateCreator<ChatStore, [], [], FeedbackSlice> = (set) => ({
  copiedMessageId: null,
  errorMessage: '',

  setCopied: (copiedMessageId) => set({ copiedMessageId }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
});
