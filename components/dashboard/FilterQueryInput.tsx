/**
 * MongoDB filter query input with auto-pairing and JSON-driven suggestions.
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import filterSuggestionsConfig from '@/config/filterSuggestions.json';

export type FilterSuggestion = {
  id: string;
  label: string;
  detail?: string;
  keywords: string[];
  insert: string;
  cursorOffset: number;
};

type FilterSuggestionsConfig = {
  pairs: Record<string, string>;
  suggestions: FilterSuggestion[];
};

const config = filterSuggestionsConfig as FilterSuggestionsConfig;
const constructorNames = new Set(
  config.suggestions
    .map((suggestion) => suggestion.label)
    .filter((label) => !label.startsWith('$'))
);
const operatorNames = new Set(
  config.suggestions
    .map((suggestion) => suggestion.label)
    .filter((label) => label.startsWith('$'))
);

const syntaxTokenPattern =
  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\$[A-Za-z_][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*(?=\s*\()|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b|[{}[\]():,])/g;

function renderHighlightedFilter(value: string) {
  if (!value) return null;

  return value.split(syntaxTokenPattern).map((token, index) => {
    let color = 'text-foreground';

    if (/^["']/.test(token)) {
      color = 'text-amber-600 dark:text-amber-400';
    } else if (constructorNames.has(token)) {
      color = 'text-blue-600 dark:text-blue-400';
    } else if (operatorNames.has(token) || token.startsWith('$')) {
      color = 'text-indigo-600 dark:text-indigo-400';
    } else if (/^(true|false|null)$/.test(token)) {
      color = 'text-violet-600 dark:text-violet-400';
    } else if (/^-?\d+(?:\.\d+)?$/.test(token)) {
      color = 'text-emerald-600 dark:text-emerald-400';
    } else if (/^[{}[\]():,]$/.test(token)) {
      color = 'text-muted-foreground';
    }

    return (
      <span key={`${index}-${token}`} className={color}>
        {token}
      </span>
    );
  });
}

interface FilterQueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

function getTokenBeforeCursor(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const match = before.match(/[A-Za-z_$][A-Za-z0-9_$]*$/);
  if (!match) return null;
  return { token: match[0], start: cursor - match[0].length };
}

export const FilterQueryInput: React.FC<FilterQueryInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  hasError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const pendingCursorRef = useRef<number | null>(null);

  const tokenInfo = useMemo(() => getTokenBeforeCursor(value, cursor), [value, cursor]);

  const matches = useMemo(() => {
    if (!tokenInfo || tokenInfo.token.length < 1) return [];

    const needle = tokenInfo.token.toLowerCase();
    return config.suggestions
      .filter((suggestion) => {
        const haystack = [suggestion.label, suggestion.id, ...suggestion.keywords]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle) || suggestion.label.toLowerCase().startsWith(needle);
      })
      .slice(0, 8);
  }, [tokenInfo]);

  useEffect(() => {
    setOpen(matches.length > 0);
    setActiveIndex(0);
  }, [matches]);

  useEffect(() => {
    if (pendingCursorRef.current === null || !inputRef.current) return;
    const next = pendingCursorRef.current;
    pendingCursorRef.current = null;
    inputRef.current.setSelectionRange(next, next);
    setCursor(next);
  }, [value]);

  const applySuggestion = (suggestion: FilterSuggestion) => {
    if (!tokenInfo) return;

    const before = value.slice(0, tokenInfo.start);
    const after = value.slice(cursor);
    const nextValue = `${before}${suggestion.insert}${after}`;
    const nextCursor = before.length + suggestion.cursorOffset;

    pendingCursorRef.current = nextCursor;
    onChange(nextValue);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const hasSelection = start !== end;

    if (open && matches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % matches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(matches[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
      return;
    }

    // Skip over an already-present closing pair
    const closingChars = new Set(Object.values(config.pairs));
    if (!hasSelection && closingChars.has(e.key) && value[start] === e.key) {
      e.preventDefault();
      pendingCursorRef.current = start + 1;
      onChange(value);
      return;
    }

    const closer = config.pairs[e.key];
    if (!closer || hasSelection) return;

    // For quotes: if next char is the same quote, skip instead of pairing again
    if ((e.key === '"' || e.key === "'") && value[start] === e.key) {
      e.preventDefault();
      pendingCursorRef.current = start + 1;
      onChange(value);
      return;
    }

    e.preventDefault();
    const nextValue = `${value.slice(0, start)}${e.key}${closer}${value.slice(end)}`;
    pendingCursorRef.current = start + 1;
    onChange(nextValue);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-0 flex h-10 w-full items-center overflow-hidden rounded-md border border-transparent px-3 py-2',
          'whitespace-pre text-sm font-mono',
          className
        )}
      >
        <div style={{ transform: `translateX(-${scrollLeft}px)` }}>
          {renderHighlightedFilter(value)}
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        spellCheck={false}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursor(e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onKeyUp={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={handleKeyDown}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        onBlur={() => {
          // Delay so suggestion click can register
          setTimeout(() => setOpen(false), 150);
        }}
        className={cn(
          'relative z-10 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-transparent caret-foreground ring-offset-background',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 font-mono',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
      />

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <ul className="max-h-56 overflow-y-auto py-1">
            {matches.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors',
                    index === activeIndex ? 'bg-accent' : 'hover:bg-accent/60'
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(suggestion)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      suggestion.label.startsWith('$')
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {suggestion.label}
                  </span>
                  {suggestion.detail && (
                    <span className="text-xs text-muted-foreground">{suggestion.detail}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
