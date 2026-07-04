'use client';

import { LogOutIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

import { ThemeMenuItems } from '@/components/theme/theme-menu-items';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDynamicChartsPreference } from '@/lib/chat/dynamic-charts-preference';
import { useSandboxDashboardsPreference } from '@/lib/chat/sandbox-dashboards-preference';
import { chatStrings } from '@/lib/chat/strings';

interface UserMenuProps {
  email: string;
  role?: string;
}

async function handleSignOut() {
  // Revoke the backend session first (best-effort), then clear the local one.
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — sign out locally regardless of backend reachability.
  }

  await signOut({ redirectTo: '/login' });
}

export function UserMenu({ email, role }: UserMenuProps) {
  const initial = email.charAt(0).toUpperCase() || 'U';
  const dynamicChartsEnabled = useDynamicChartsPreference((state) => state.enabled);
  const setDynamicChartsEnabled = useDynamicChartsPreference((state) => state.setEnabled);
  const sandboxDashboardsEnabled = useSandboxDashboardsPreference((state) => state.enabled);
  const setSandboxDashboardsEnabled = useSandboxDashboardsPreference((state) => state.setEnabled);
  const [confirmSandboxOpen, setConfirmSandboxOpen] = useState(false);
  const dialogStrings = chatStrings.sandboxDashboardsDialog;

  function handleSandboxToggle(checked: boolean) {
    if (checked) {
      // Enabling (false -> true) requires confirmation first; the toggle
      // itself does not flip until the user confirms in the dialog.
      setConfirmSandboxOpen(true);
      return;
    }
    // Disabling flips immediately, no confirmation needed.
    setSandboxDashboardsEnabled(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Abrir menú de usuario"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <span className="flex flex-col">
                <span className="truncate font-medium text-foreground">{email}</span>
                {role ? (
                  <span className="text-xs font-normal text-muted-foreground">{role}</span>
                ) : null}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <ThemeMenuItems />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem
              checked={dynamicChartsEnabled}
              onCheckedChange={(checked) => {
                setDynamicChartsEnabled(checked);
              }}
            >
              Gráficas dinámicas
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sandboxDashboardsEnabled}
              onCheckedChange={handleSandboxToggle}
            >
              {chatStrings.userMenu.sandboxDashboardsToggle}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
              <LogOutIcon />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmSandboxOpen} onOpenChange={setConfirmSandboxOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogStrings.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogStrings.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dialogStrings.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSandboxDashboardsEnabled(true);
              }}
            >
              {dialogStrings.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
