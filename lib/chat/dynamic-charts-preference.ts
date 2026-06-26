'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DynamicChartsPreference {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useDynamicChartsPreference = create<DynamicChartsPreference>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'mirador-dynamic-charts',
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
);
