'use client';

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ThemeMenuItems() {
  const { setTheme } = useTheme();

  return (
    <>
      <DropdownMenuItem onClick={() => setTheme('light')}>
        <SunIcon />
        Claro
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')}>
        <MoonIcon />
        Oscuro
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('system')}>
        <MonitorIcon />
        Sistema
      </DropdownMenuItem>
    </>
  );
}
