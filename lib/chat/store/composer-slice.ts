import { DEFAULT_INTENT_MODE } from '@/lib/chat/types';

import type { ChatStore } from '@/lib/chat/store';
import type { ChatIntentMode } from '@/lib/chat/types';
import type { StateCreator } from 'zustand';

export interface ComposerSlice {
  input: string;
  intentMode: ChatIntentMode;

  setInput: (input: string) => void;
  setIntentMode: (intentMode: ChatIntentMode) => void;
}

export const createComposerSlice: StateCreator<ChatStore, [], [], ComposerSlice> = (set) => ({
  input: '',
  intentMode: DEFAULT_INTENT_MODE,

  setInput: (input) => set({ input }),
  setIntentMode: (intentMode) => set({ intentMode }),
});
