'use client';

import React from 'react';
import { type NavItem } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSearchValue, handleDefaultSearchBtn, handleDefaultSearchInp } from '@/lib/dom';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { searchApi } from '@/redux/features/search/searchApi';
import {
  setQuery as searchSetQuery,
  setIsOpen as searchSetIsOpen,
  reset as searchReset,
} from '@/redux/features/search/searchSlice';
import { SearchField } from '@/features/search/search-field';
import { DropdownMenuBase } from '@/components/ui/DropdownMenuBase';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useWindowListeners } from '@/hooks/use-window-listeners';

interface MainNavProps {
  items?: NavItem[];
}

export function MainNav({ items }: MainNavProps) {
  const path = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((state) => state.search.query);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Get showHelp function from keyboard shortcuts hook
  const { showHelp } = useKeyboardShortcuts();

  const handlePopstateEvent = () => {
    const pathname = window.location.pathname;
    const search: string = getSearchValue('q');

    if (!search?.length || !pathname.includes('/search')) {
      dispatch(searchReset());
      dispatch(searchSetIsOpen(false));
    } else if (search?.length) {
      dispatch(searchSetIsOpen(true));
      dispatch(searchSetQuery(search));
      setTimeout(() => {
        handleDefaultSearchBtn();
      }, 10);
      setTimeout(() => {
        handleDefaultSearchInp();
      }, 20);
      void dispatch(searchApi.endpoints.search.initiate(search));
    }
  };

  useWindowListeners({ onPopState: handlePopstateEvent });

  async function searchShowsByQuery(value: string) {
    if (!value?.trim()?.length) {
      if (path === '/search') {
        try {
          router.push('/');
        } catch {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
      } else {
        try {
          router.replace(path);
        } catch {
          // Router not ready, silently fail
        }
      }
      return;
    }

    // Navigate to search page - let the search page handle data fetching
    try {
      if (getSearchValue('q')?.trim()?.length) {
        router.replace(`/search?q=${value}`);
      } else {
        router.push(`/search?q=${value}`);
      }
    } catch {
      // Router not ready, fallback to window.location
      if (typeof window !== 'undefined') {
        window.location.href = `/search?q=${value}`;
      }
    }
  }

  // change background color on scroll
  React.useEffect(() => {
    const changeBgColor = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', changeBgColor);
    return () => window.removeEventListener('scroll', changeBgColor);
  }, []);

  // Clear search on navigation away from search page
  React.useEffect(() => {
    if (path !== '/search') {
      dispatch(searchReset());
      dispatch(searchSetIsOpen(false));
    }
  }, [path, dispatch]);



  const handleMobileMenuOpenChange = (open: boolean) => {
    setIsMobileMenuOpen(open);
  };



  return (
    <nav
      className={cn(
        'from-neutral-950/80 relative flex h-12 w-full items-center justify-between bg-linear-to-b from-10% px-[4vw] transition-colors duration-300 md:sticky md:h-16',
        isScrolled ? 'bg-neutral-950/80 text-white shadow-md backdrop-blur-2xl' : 'bg-transparent',
      )}>
      <div className="flex items-center gap-6 md:gap-10">
        <Link
          href="/"
          className="hidden md:block">
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
                    onClick={() => dispatch(searchReset())}>
                    {item.title}
                  </Link>
                ),
            )}
          </nav>
        ) : null}
        <div className="block md:hidden">
          <DropdownMenuBase
            items={items || []}
            onOpenChange={handleMobileMenuOpenChange}
            onItemClick={() => dispatch(searchReset())}
            trigger={
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-0 hover:bg-transparent focus:ring-0"
              >
                <Icons.logo className="h-6 w-6" />
                {isMobileMenuOpen ? (
                  <Icons.close className="h-6 w-6" />
                ) : (
                  <Icons.menu className="h-6 w-6" />
                )}
                <span className="text-base font-bold">Menu</span>
              </Button>
            }
            className="w-52 overflow-x-hidden overflow-y-auto rounded-xl"
            sideOffset={5}
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <SearchField
          id="search-input"
          value={searchQuery}
          onChange={searchShowsByQuery}
          debounceTimeout={2000}
          className={cn('flex')}
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
          data-tooltip="Show keyboard shortcuts (?)"
          >
          <Icons.helpCircle className="h-5 w-5" />
        </Button>
        {/* <ThemeToggle /> */}
        {/* <ServerRecommendationSwitch
          switchClass="flex item--center gap-2 place-content-center text-sm"
          text=""
          tooltipText="enable or disable scroll down suggestion"
        /> */}
      </div>
    </nav>
  );
}

export default MainNav;
