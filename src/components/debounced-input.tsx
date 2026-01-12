import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { useSearch } from '@/hooks/use-search';
import { X, Clock } from 'lucide-react';

interface DebouncedInputProps extends Omit<InputProps, 'onChange'> {
  className?: string;
  value: string;
  onChange: (value: string) => Promise<void>;
  debounceTimeout?: number;
  maxLength?: number;
}

const RECENT_SEARCHES_KEY = 'movie-app-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function DebouncedInput({
  id = 'query',
  value,
  onChange,
  maxLength = 80,
  debounceTimeout = 500,
  className,
  ...props
}: DebouncedInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const { search, clearSearch } = useSearch({ debounceTimeout });

  // Load recent searches on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save to history when search is performed
  const addToHistory = React.useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // close search input on clicking outside,
  useOnClickOutside(dropdownRef, () => {
    setShowHistory(false);
  });

  // configure keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // close search input on pressing escape
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  // change background color on scroll
  React.useEffect(() => {
    const changeBgColor = () => {
      window.scrollY > 0 ? setIsScrolled(true) : setIsScrolled(false);
    };
    window.addEventListener('scroll', changeBgColor);
    return () => window.removeEventListener('scroll', changeBgColor);
  }, []);

  const handleSearch = React.useCallback(
    async (val: string) => {
      search(val);
      await onChange(val);
      if (val.trim().length > 3) {
        addToHistory(val.trim());
      }
    },
    [search, onChange, addToHistory],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    handleSearch(val);
    setShowHistory(!val && recentSearches.length > 0);
  };

  const handleRecentClick = (s: string) => {
    if (inputRef.current) {
      inputRef.current.value = s;
      void handleSearch(s);
      setShowHistory(false);
    }
  };

  const handleClear = () => {
    clearSearch();
    void onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    if (recentSearches.length > 0) {
      setShowHistory(true);
    }
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setShowHistory(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div className="flex items-center">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          placeholder="Search..."
          onFocus={() => {
            if (!inputRef.current?.value && recentSearches.length > 0)
              setShowHistory(true);
          }}
          className={cn(
            'h-auto w-28 rounded-xl border border-white/20 bg-neutral-800 py-1.5 pl-8 pr-8 text-sm text-white transition-all duration-300 placeholder:text-neutral-500 focus:bg-neutral-700/80 focus:ring-0 md:w-40 lg:w-60',
            className,
          )}
          defaultValue={value}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        <Button
          id="search-btn"
          aria-label="Search"
          variant="ghost"
          className={cn(
            'absolute top-1/2 left-1 h-auto -translate-y-1/2 rounded-full p-1 transition-all duration-300',
          )}
          onClick={() => {
            inputRef.current?.focus();
          }}>
          <Icons.search className="h-4 w-4 text-white" aria-hidden="true" />
        </Button>

        {(value || (inputRef.current && inputRef.current.value)) ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full p-1 text-white hover:bg-white/10"
            onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <div className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
            <kbd className="hidden h-5 select-none items-center gap-1 rounded border border-neutral-600 bg-neutral-900 px-1.5 font-mono text-[10px] font-medium text-neutral-400 opacity-100 md:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showHistory && recentSearches.length > 0 && (
        <div className="absolute top-full right-0 mt-3 w-screen max-w-[calc(100vw-2rem)] min-w-[240px] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:w-full md:max-w-none">
          <div className="flex items-center justify-between bg-white/5 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Recent Searches
            </span>
            <button
              onClick={clearAllHistory}
              className="text-[10px] font-medium text-neutral-500 hover:text-white hover:underline">
              Clear All
            </button>
          </div>
          <div className="flex flex-col py-1">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                className="group/item flex items-center justify-between px-4 py-2.5 text-left transition hover:bg-white/5"
                onClick={() => handleRecentClick(s)}>
                <div className="flex items-center gap-3">
                  <Clock className="h-3.5 w-3.5 text-neutral-500 group-hover/item:text-neutral-300" />
                  <span className="truncate text-sm text-neutral-300 group-hover/item:text-white">
                    {s}
                  </span>
                </div>
                <Icons.chevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover/item:opacity-100 text-neutral-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
