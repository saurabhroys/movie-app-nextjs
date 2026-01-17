'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { useSearch } from '@/hooks/use-search';
import { X } from 'lucide-react';

interface OptimizedSearchInputProps extends Omit<InputProps, 'onChange'> {
  className?: string;
  value: string;
  open: boolean;
  onChange: (value: string) => Promise<void>;
  onChangeStatusOpen: (value: boolean) => void;
  debounceTimeout?: number;
  maxLength?: number;
  minQueryLength?: number;
}

export function OptimizedSearchInput({
  id = 'query',
  open,
  value,
  onChange,
  maxLength = 80,
  debounceTimeout = 500,
  minQueryLength = 2,
  onChangeStatusOpen,
  className,
  ...props
}: OptimizedSearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const { search, clearSearch, loading, shows, query, cancelCurrentRequest } =
    useSearch({
      debounceTimeout,
      minQueryLength,
      onError: (error) => {
        console.error('Search error:', error);
      },
    });

  // Close search input on clicking outside
  useOnClickOutside(inputRef, () => {
    if (!value) onChangeStatusOpen(false);
  });

  // Configure keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close search input on pressing escape
      if (e.key === 'Escape') {
        clearSearch();
        void onChange('');
        onChangeStatusOpen(false);
      }
      // Open search input on pressing ctrl + k or cmd + k
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (!inputRef.current) return;
        e.preventDefault();
        onChangeStatusOpen(true);
        inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onChange, onChangeStatusOpen, clearSearch]);

  // Change background color on scroll
  React.useEffect(() => {
    const changeBgColor = () => {
      window.scrollY > 0 ? setIsScrolled(true) : setIsScrolled(false);
    };
    window.addEventListener('scroll', changeBgColor);
    return () => window.removeEventListener('scroll', changeBgColor);
  }, [isScrolled]);

  const handleSearch = React.useCallback(
    async (value: string) => {
      search(value);
      await onChange(value);
    },
    [search, onChange],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(event.target.value);
  };

  const handleClear = () => {
    clearSearch();
    void onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form
      className={cn('relative', className)}
      onSubmit={(e) => e.preventDefault()}
      autoComplete="off"
    >
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder="Search..."
        className={cn(
          'h-auto rounded-xl bg-neutral-800 py-1.5 pr-8 pl-8 text-sm text-white transition-all duration-300',
          open
            ? 'w-28 border bg-neutral-800 md:w-40 lg:w-60'
            : 'w-0 border-none md:w-40 md:border lg:w-60',
          className,
        )}
        defaultValue={value}
        maxLength={maxLength}
        onChange={handleChange}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-autocomplete="none"
        role="presentation"
        name={`search_${Math.random().toString(36).substring(7)}`}
        {...props}
      />

      {/* Search button */}
      <Button
        id="search-btn"
        aria-label="Search"
        variant="ghost"
        className={cn(
          'absolute top-1/2 h-auto -translate-y-1/2 rounded-full p-1',
          open ? 'left-1' : 'left-[9px] md:left-1',
        )}
        onClick={() => {
          if (!inputRef.current) {
            return;
          }
          inputRef.current.focus();
          onChangeStatusOpen(!open);
        }}>
        <Icons.search
          className={cn(
            'text-white transition-opacity',
            open ? 'h-4 w-4' : 'h-5 w-5',
          )}
          aria-hidden="true"
        />
      </Button>

      {/* Clear button - only show when there's a query */}
      {open && query && (
        <Button
          aria-label="Clear search"
          variant="ghost"
          className="absolute top-1/2 right-1 h-auto -translate-y-1/2 rounded-full p-1"
          onClick={handleClear}>
          <X className="h-4 w-4 text-white" aria-hidden="true" />
        </Button>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 right-1 h-auto -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* Keyboard shortcut indicator */}
      {!open && (
        <div className="pointer-events-none absolute top-[45%] right-2 -translate-y-1/2">
          <kbd
            className={cn(
              'hidden items-center rounded border border-neutral-400 px-1.5 py-0.5 font-mono text-xs text-neutral-400 md:inline-flex',
            )}>
            ⌘K
          </kbd>
        </div>
      )}

      {/* Search results count indicator */}
      {open && shows.length > 0 && (
        <div className="absolute top-full right-0 left-0 mt-1 text-center text-xs text-neutral-400">
          {shows.length} result{shows.length !== 1 ? 's' : ''} found
        </div>
      )}
    </form>
  );
}
