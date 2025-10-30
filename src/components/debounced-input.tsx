import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { useSearch } from '@/hooks/use-search';

interface DebouncedInputProps extends Omit<InputProps, 'onChange'> {
  className?: string;
  value: string;
  open: boolean;
  onChange: (value: string) => Promise<void>;
  onChangeStatusOpen: (value: boolean) => void;
  debounceTimeout?: number;
  maxLength?: number;
}

export function DebouncedInput({
  id = 'query',
  open,
  value,
  onChange,
  maxLength = 80,
  debounceTimeout = 500,
  onChangeStatusOpen,
  className,
  ...props
}: DebouncedInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { search, clearSearch } = useSearch({ debounceTimeout });

  // close search input on clicking outside,
  useOnClickOutside(inputRef, () => {
    if (!value) onChangeStatusOpen(false);
  });

  // configure keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // close search input on pressing escape
      if (e.key === 'Escape') {
        clearSearch();
        void onChange('');
        onChangeStatusOpen(false);
      }
      // open search input on pressing ctrl + k or cmd + k
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
  }, [onChange, onChangeStatusOpen]);

  // change background color on scroll
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

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder="Search..."
        className={cn(
          'h-auto rounded-xl bg-neutral-800 py-1.5 pl-8 text-sm text-white transition-all duration-300',
          open
            ? 'w-28 border bg-neutral-800 md:w-40 lg:w-60'
            : 'w-0 border-none md:w-40 md:border lg:w-60',
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
    </div>
  );
}
