import type { ChatStore } from '@/lib/chat/store';
import type { StateCreator } from 'zustand';

/**
 * Conversation state held client-side: the active conversation id, threaded into
 * each request so the backend continues the same thread. The conversation LIST is
 * fetched on the server (layout) and the sidebar open state lives in the shadcn
 * `SidebarProvider` (cookie-backed), so neither is stored here.
 */
export interface ConversationsSlice {
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
}

export const createConversationsSlice: StateCreator<ChatStore, [], [], ConversationsSlice> = (
  set
) => ({
  activeConversationId: null,
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
});
