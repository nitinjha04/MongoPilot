/**
 * Header Component
 * Top navigation bar with connection selector and theme toggle
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, Database, Moon, Plus, Sun } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConnectionManager } from './ConnectionManager';
import { cn } from '@/lib/utils';
import { app_name } from '../../config.js';

const statusStyles: Record<string, string> = {
  connected: 'bg-green-500',
  connecting: 'bg-amber-500 animate-pulse',
  error: 'bg-destructive',
  disconnected: 'bg-muted-foreground/50',
};

export const Header: React.FC = () => {
  const { connections, activeConnectionId, theme, setTheme, toggleCommandPalette } = useStore();
  const [showConnectionManager, setShowConnectionManager] = useState(false);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="border-b border-border bg-card px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Logo and Connection Selector */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <img src="/logo.png" alt={app_name} className="h-5 w-5 sm:h-8 sm:w-8" />
            <h1 className="text-sm sm:text-xl font-bold hidden sm:block">{app_name}</h1>
            <h1 className="text-sm font-bold sm:hidden">{app_name}</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowConnectionManager(true)}
            className={cn(
              'flex items-center gap-2 min-w-0 max-w-[220px] sm:max-w-xs rounded-md border border-border bg-background px-2.5 sm:px-3 py-1.5 text-left transition-colors',
              'hover:bg-accent hover:border-accent-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            title={activeConnection ? 'Manage connections' : 'Add a connection'}
          >
            {activeConnection ? (
              <>
                <span
                  className={cn(
                    'h-2 w-2 flex-shrink-0 rounded-full',
                    statusStyles[activeConnection.status] ?? statusStyles.disconnected
                  )}
                  aria-hidden
                />
                <Database className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-medium">
                  {activeConnection.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-xs sm:text-sm font-medium text-muted-foreground">
                  {connections.length === 0 ? 'Add Connection' : 'Select Connection'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCommandPalette}
            className="hidden md:flex"
            title="Open Command Palette"
          >
            <span className="text-xs font-mono">. + K</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-10 sm:w-10">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Connection Manager Modal */}
      <Modal
        isOpen={showConnectionManager}
        onClose={() => setShowConnectionManager(false)}
        title="Manage Connections"
        size="lg"
        footer={
          <Button onClick={() => setShowConnectionManager(false)}>
            Close
          </Button>
        }
      >
        <ConnectionManager onConnectionSelect={() => setShowConnectionManager(false)} />
      </Modal>
    </header>
  );
};
