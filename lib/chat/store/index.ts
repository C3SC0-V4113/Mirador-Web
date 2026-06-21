import { create } from 'zustand';

import { createComposerSlice, type ComposerSlice } from '@/lib/chat/store/composer-slice';
import {
  createConversationsSlice,
  type ConversationsSlice,
} from '@/lib/chat/store/conversations-slice';
import { createFeedbackSlice, type FeedbackSlice } from '@/lib/chat/store/feedback-slice';
import { createMessagesSlice, type MessagesSlice } from '@/lib/chat/store/messages-slice';
import { createRuntimeSlice, type RuntimeSlice } from '@/lib/chat/store/runtime-slice';

/**
 * Single Zustand store composed of focused slices, replacing `other-gpt`'s
 * giant reducer tree. Each slice owns one concern: messages, composer input,
 * request runtime, and transient feedback. Derived values (isEmptyState,
 * isSendDisabled) are computed with selectors in components, not stored.
 */
export type ChatStore = MessagesSlice &
  ComposerSlice &
  RuntimeSlice &
  FeedbackSlice &
  ConversationsSlice;

export const useChatStore = create<ChatStore>()((...args) => ({
  ...createMessagesSlice(...args),
  ...createComposerSlice(...args),
  ...createRuntimeSlice(...args),
  ...createFeedbackSlice(...args),
  ...createConversationsSlice(...args),
}));
