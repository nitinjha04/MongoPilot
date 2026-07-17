/**
 * Global Sonner toaster — mount once at the app root.
 */

'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useStore } from '@/lib/store';

export function Toaster() {
  const theme = useStore((state) => state.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      gap={8}
      toastOptions={{
        classNames: {
          toast: 'border border-border shadow-lg',
        },
      }}
    />
  );
}
