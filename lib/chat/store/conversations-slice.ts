import type { ChatStore } from '@/lib/chat/store';
import type { ConversationSummary } from '@/lib/chat/types';
import type { StateCreator } from 'zustand';

/**
 * Conversation state: the active conversation id (threaded into each request so
 * the backend continues the same thread instead of creating a new one) and the
 * list of past conversations for the history surface.
 */
export interface ConversationsSlice {
  activeConversationId: string | null;
  conversations: ConversationSummary[];
  isLoadingConversations: boolean;
  isLoadingConversation: boolean;
  isHistoryOpen: boolean;

  setActiveConversationId: (conversationId: string | null) => void;
  setConversations: (conversations: ConversationSummary[]) => void;
  setLoadingConversations: (loading: boolean) => void;
  setLoadingConversation: (loading: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
}

export const createConversationsSlice: StateCreator<ChatStore, [], [], ConversationsSlice> = (
  set
) => ({
  activeConversationId: null,
  conversations: [],
  isLoadingConversations: false,
  isLoadingConversation: false,
  isHistoryOpen: false,

  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setConversations: (conversations) => set({ conversations }),
  setLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
  setLoadingConversation: (isLoadingConversation) => set({ isLoadingConversation }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
});
