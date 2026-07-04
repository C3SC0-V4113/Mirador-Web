'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SandboxDashboardsPreference {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useSandboxDashboardsPreference = create<SandboxDashboardsPreference>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'mirador-sandbox-dashboards',
      partialize: (state) => ({ enabled: state.enabled }),
    }
  )
);
