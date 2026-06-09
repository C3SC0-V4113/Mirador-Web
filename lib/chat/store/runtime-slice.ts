import type { ChatStore } from '@/lib/chat/store';
import type { StateCreator } from 'zustand';

export interface RuntimeSlice {
  isSubmitting: boolean;
  pendingAssistantMessageId: string | null;

  setSubmitting: (isSubmitting: boolean) => void;
  setPendingAssistantMessageId: (messageId: string | null) => void;
}

export const createRuntimeSlice: StateCreator<ChatStore, [], [], RuntimeSlice> = (set) => ({
  isSubmitting: false,
  pendingAssistantMessageId: null,

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setPendingAssistantMessageId: (pendingAssistantMessageId) => set({ pendingAssistantMessageId }),
});
