import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { useSearch } from '@/hooks/use-search';
import { X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isFocused, setIsFocused] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [localValue, setLocalValue] = React.useState(value);
  const { search, searchImmediate, clearSearch, loading } = useSearch({
    debounceTimeout,
  });

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

  // Synchronize localValue with value prop
  // Only sync if the prop value actually changed and it's different from our local state
  // This prevents the global store from "fighting" with the local typing state.
  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounce the parent's onChange call
  const debouncedPropsOnChange = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (val: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void onChange(val);
      }, debounceTimeout);
    };
  }, [onChange, debounceTimeout]);

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

  const removeFromHistory = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // close search input on clicking outside
  useOnClickOutside(dropdownRef, () => {
    setShowHistory(false);
    setIsFocused(false);
  });

  // configure keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowHistory(false);
        setIsFocused(false);
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
      debouncedPropsOnChange(val);
      if (val.trim().length > 3) {
        addToHistory(val.trim());
      }
    },
    [search, debouncedPropsOnChange, addToHistory],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setLocalValue(val);
    void handleSearch(val);
    setShowHistory(!val && recentSearches.length > 0);
  };

  const handleRecentClick = (s: string) => {
    setLocalValue(s);
    if (inputRef.current) {
      inputRef.current.value = s;
      void searchImmediate(s);
      void onChange(s);
      setShowHistory(false);
    }
  };

  const handleClear = () => {
    setLocalValue('');
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
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused
            ? '0 0 20px rgba(255, 255, 255, 0.05)'
            : '0 0 0px rgba(255, 255, 255, 0)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          placeholder="Search..."
          onFocus={() => {
            setIsFocused(true);
            if (!inputRef.current?.value && recentSearches.length > 0)
              setShowHistory(true);
          }}
          className={cn(
            'h-10 w-28 rounded-xl border border-white/10 bg-neutral-900/50 py-1.5 pl-9 pr-9 text-sm text-white backdrop-blur-md transition-colors placeholder:text-neutral-500 focus:border-white/30 focus:bg-neutral-800/80 focus:ring-0 md:w-40 lg:w-64',
            className,
          )}
          value={localValue}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />

        <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ duration: 0.2 }}>
                <Icons.spinner className="h-4 w-4 animate-spin text-neutral-400" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: isFocused ? 1.1 : 1,
                  color: isFocused ? '#fff' : '#737373',
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}>
                <Icons.search className="h-4 w-4" aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {localValue ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-1 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                onClick={handleClear}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <kbd className="hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-neutral-500 md:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Searches Dropdown */}
      <AnimatePresence>
        {showHistory && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-screen min-w-[260px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md md:w-full md:max-w-none">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Recent Searches
              </span>
              <button
                onClick={clearAllHistory}
                className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-white">
                Clear All
              </button>
            </div>
            <motion.div className="flex flex-col py-2">
              {recentSearches.map((s, i) => (
                <div
                  key={i}
                  className="group/item flex items-center justify-between px-1"
                >
                  <motion.div
                    role="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex w-full justify-between items-center rounded-lg px-2 py-1.5 transition-all hover:bg-white/5 cursor-pointer"
                    onClick={() => handleRecentClick(s)}
                  >
                    <div className="flex flex-1 gap-3 items-center text-left cursor-pointer">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors group-hover/item:bg-white/10 group-hover/item:text-white">
                        <Clock className="h-3 w-3" />
                      </div>
                      <span className="truncate text-sm font-medium text-neutral-300 transition-colors group-hover/item:text-white">
                        {s}
                      </span>
                    </div>
                  <button
                    onClick={(e) => removeFromHistory(e, s)}
                    className="-mr-1 flex h-6 w-6 items-center justify-center rounded-lg text-neutral-500 opacity-0 transition-all hover:bg-white/10 hover:text-red-400 group-hover/item:opacity-100 cursor-pointer"
                    aria-label="Remove from history"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

