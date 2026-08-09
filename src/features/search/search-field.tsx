import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { useSearch } from '@/hooks/use-search';
import { X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the unified SearchField component.
 * It combines the visual appearance of `SearchInput` and the debounced
 * behaviour of `DebouncedInput`, including recent‑search history.
 */
interface SearchFieldProps extends Omit<InputProps, 'onChange'> {
  /** Current value controlled by the parent */
  value: string;
  /** Called when the debounced value changes */
  onChange: (value: string) => Promise<void>;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms – default 500 */
  debounceTimeout?: number;
  /** Maximum input length – default 80 */
  maxLength?: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * SearchField – a reusable, typed, debounced search input with recent‑search
 * dropdown. It uses the existing `useSearch` hook for the actual query logic.
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search movie',
  debounceTimeout = 500,
  maxLength = 80,
  className,
  ...inputProps
}: SearchFieldProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] = React.useState(value);
  const [showHistory, setShowHistory] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  const { search, searchImmediate, clearSearch, loading } = useSearch({
    debounceTimeout,
  });

  // Load recent searches once on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('movie-app-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Keep local state in sync when parent changes value
  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounce parent onChange – we create a stable function to avoid resetting the timer
  const debouncedOnChange = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (val: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void onChange(val);
      }, debounceTimeout);
    };
  }, [onChange, debounceTimeout]);

  // Save to recent history when a search succeeds
  const addToHistory = React.useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('movie-app-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Click‑outside handling closes the history dropdown
  useOnClickOutside(dropdownRef, () => {
    setShowHistory(false);
  });

  // Keyboard shortcuts: ⌘K focuses, Escape blurs & closes history
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Perform search when the user types (debounced)
  const handleSearch = React.useCallback(
    async (val: string) => {
      search(val);
      debouncedOnChange(val);
      if (val.trim().length > 3) addToHistory(val);
    },
    [search, debouncedOnChange, addToHistory]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
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
    if (recentSearches.length > 0) setShowHistory(true);
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('movie-app-recent-searches');
    setShowHistory(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <motion.div
        animate={{
          scale: showHistory ? 1.02 : 1,
          boxShadow: showHistory
            ? '0 0 20px rgba(255,255,255,0.05)'
            : '0 0 0px rgba(255,255,255,0)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn(
            'h-10 w-32 rounded-xl border border-white/10 bg-neutral-900/50 py-1.5 pl-9 pr-9 text-sm text-white backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500 focus:border-white/30 focus:bg-neutral-800/80 focus:ring-0 focus:w-44 sm:w-36 sm:focus:w-48 md:w-40 md:focus:w-52 lg:w-64 lg:focus:w-80',
            className
          )}
          value={localValue}
          maxLength={maxLength}
          onChange={handleChange}
          {...inputProps}
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                <Icons.spinner className="h-4 w-4 animate-spin text-neutral-400" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: showHistory ? 1.1 : 1,
                  color: showHistory ? '#fff' : '#737373',
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
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
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
            >
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
            className="absolute right-0 top-full mt-2 w-screen min-w-[260px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md md:w-full md:max-w-none"
          >
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Recent Searches
              </span>
              <button
                onClick={clearAllHistory}
                className="text-[11px] font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Clear All
              </button>
            </div>
            <motion.div className="flex flex-col py-2">
              {recentSearches.map((s, i) => (
                <div key={i} className="group/item flex items-center justify-between px-1">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches((prev) => prev.filter((v) => v !== s));
                        localStorage.setItem(
                          'movie-app-recent-searches',
                          JSON.stringify(recentSearches.filter((v) => v !== s))
                        );
                      }}
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

export default SearchField;
