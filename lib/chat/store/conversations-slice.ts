import type { ChatStore } from '@/lib/chat/store';
import type { StateCreator } from 'zustand';

/**
 * Conversation state held client-side: the active conversation id (threaded into
 * each request so the backend continues the same thread) and the mobile sidebar
 * open flag. The conversation LIST is fetched on the server (layout), not stored.
 */
export interface ConversationsSlice {
  activeConversationId: string | null;
  isHistoryOpen: boolean;

  setActiveConversationId: (conversationId: string | null) => void;
  setHistoryOpen: (open: boolean) => void;
}

export const createConversationsSlice: StateCreator<ChatStore, [], [], ConversationsSlice> = (
  set
) => ({
  activeConversationId: null,
  isHistoryOpen: false,

  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
});
