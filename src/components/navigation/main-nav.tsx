'use client';

import React from 'react';
import { type Show, type NavItem } from '@/types';
import Link from 'next/link';
import {
  cn,
  getSearchValue,
  handleDefaultSearchBtn,
  handleDefaultSearchInp,
} from '@/lib/utils';
import { siteConfig } from '@/configs/site';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@/components/compat/react19-compat';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search';
// import { ModeToggle as ThemeToggle } from '@/components/theme-toggle';
import { DebouncedInput } from '@/components/debounced-input';
import MovieService from '@/services/MovieService';
import SearchService from '@/services/SearchService';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ServerRecommendationSwitch } from '@/components/server-recommendation-switch';

interface MainNavProps {
  items?: NavItem[];
}

interface SearchResult {
  results: Show[];
}

export function MainNav({ items }: MainNavProps) {
  const path = usePathname();
  const router = useRouter();
  // search store
  const searchStore = useSearchStore();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Get showHelp function from keyboard shortcuts hook
  const { showHelp } = useKeyboardShortcuts();

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, []);

  const handlePopstateEvent = () => {
    const pathname = window.location.pathname;
    const search: string = getSearchValue('q');

    if (!search?.length || !pathname.includes('/search')) {
      searchStore.reset();
      searchStore.setOpen(false);
    } else if (search?.length) {
      searchStore.setOpen(true);
      searchStore.setLoading(true);
      searchStore.setQuery(search);
      setTimeout(() => {
        handleDefaultSearchBtn();
      }, 10);
      setTimeout(() => {
        handleDefaultSearchInp();
      }, 20);
      SearchService.searchMovies(search)
        .then(({ results }) => {
          void searchStore.setShows(results);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        })
        .finally(() => searchStore.setLoading(false));
    }
  };

  async function searchShowsByQuery(value: string) {
    if (!value?.trim()?.length) {
      if (path === '/search') {
        router.push('/home');
      } else {
        router.replace(path);
      }
      return;
    }

    // Navigate to search page - let the search page handle data fetching
    if (getSearchValue('q')?.trim()?.length) {
      router.replace(`/search?q=${value}`);
    } else {
      router.push(`/search?q=${value}`);
    }
  }

  // change background color on scroll
  React.useEffect(() => {
    const changeBgColor = () => {
      window.scrollY > 0 ? setIsScrolled(true) : setIsScrolled(false);
    };
    window.addEventListener('scroll', changeBgColor);
    return () => window.removeEventListener('scroll', changeBgColor);
  }, [isScrolled]);

  const handleChangeStatusOpen = (value: boolean): void => {
    searchStore.setOpen(value);
    if (!value) searchStore.reset();
  };

  const handleMobileMenuOpenChange = (open: boolean) => {
    setIsMobileMenuOpen(open);
  };

  const isMovieWatchPage = path.startsWith('/movie');

  return (
    <nav
      className={cn(
        'from-secondary/70 relative flex h-12 w-full items-center justify-between bg-linear-to-b from-10% px-[4vw] transition-colors duration-300 md:sticky md:h-16',
        isScrolled ? 'bg-neutral-950 text-white shadow-md' : 'bg-transparent',
      )}>
      <div className="flex items-center gap-6 md:gap-10">
        <Link
          href="/"
          className="hidden md:block"
          onClick={() => handleChangeStatusOpen(false)}>
          <div className="flex items-center space-x-2">
            <Icons.logo_long className="h-7 w-auto" aria-hidden="true" />
            {/* <span className="inline-block font-bold">{siteConfig.name}</span> */}
            <span className="sr-only">Home</span>
          </div>
        </Link>
        {items?.length ? (
          <nav className="hidden gap-6 md:flex">
            {items?.map(
              (item, index) =>
                item.href && (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      'flex items-center text-sm font-medium transition',
                      path === item.href && 'text-foreground font-bold',
                      item.disabled && 'cursor-not-allowed opacity-80',
                      isScrolled
                        ? 'text-white'
                        : 'text-neutral-950 dark:text-white',
                    )}
                    onClick={() => handleChangeStatusOpen(false)}>
                    {item.title}
                  </Link>
                ),
            )}
          </nav>
        ) : null}
        <div className="block md:hidden">
          <DropdownMenu onOpenChange={handleMobileMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-0 hover:bg-transparent focus:ring-0"
                // className="h-auto px-2 py-1.5 text-base hover:bg-neutral-800 focus:ring-0 dark:hover:bg-neutral-800 lg:hidden"
              >
                <Icons.logo className="h-6 w-6" />
                {isMobileMenuOpen ? (
                  <Icons.close className="h-6 w-6" />
                ) : (
                  <Icons.menu className="h-6 w-6" />
                )}
                <span className="text-base font-bold">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={20}
              // className="w-52 overflow-y-auto overflow-x-hidden rounded-sm bg-neutral-800 text-slate-200 dark:bg-neutral-800 dark:text-slate-200"
              className="w-52 overflow-x-hidden overflow-y-auto rounded-sm">
              <DropdownMenuLabel>
                <Link
                  href="/"
                  className="flex items-center justify-center"
                  onClick={() => handleChangeStatusOpen(false)}></Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items?.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  asChild
                  className="items-center justify-center">
                  {item.href && (
                    <Link
                      href={item.href}
                      onClick={() => handleChangeStatusOpen(false)}>
                      <span
                        className={cn(
                          'text-foreground/60 hover:text-foreground/80 line-clamp-1',
                          path === item.href && 'text-foreground font-bold',
                        )}>
                        {item.title}
                      </span>
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DebouncedInput
          id="search-input"
          open={searchStore.isOpen}
          value={searchStore.query}
          onChange={searchShowsByQuery}
          onChangeStatusOpen={handleChangeStatusOpen}
          className={cn(
            // path === '/' || path === '/' ? 'hidden' :
            'flex',
          )}
        />
        {/* <Link
          rel="noreferrer"
          target="_blank"
          href={siteConfig.links.github}
          className={cn(path === '/' ? 'flex' : 'hidden')}>
          <Icons.gitHub className="h-5 w-5 hover:bg-transparent" />
        </Link> */}
        <Button
          variant="ghost"
          size="icon"
          onClick={showHelp}
          className="hidden hover:bg-transparent md:flex"
          aria-label="Show keyboard shortcuts help"
          title="Show keyboard shortcuts (?)">
          <Icons.helpCircle className="h-5 w-5" />
        </Button>
        {/* <ThemeToggle /> */}
        <ServerRecommendationSwitch
          switchClass="flex item--center gap-2 place-content-center text-sm"
          text=""
          tooltipText="enable or disable scroll down suggestion"
        />
      </div>
    </nav>
  );
}

export default MainNav;
