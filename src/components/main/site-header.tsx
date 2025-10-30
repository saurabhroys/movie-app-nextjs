'use client';
import { siteConfig } from '@/configs/site';
import React from 'react';
import MainNav from '@/components/navigation/main-nav';
// import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { usePathname } from 'next/navigation';
import { useSearchStore } from '@/stores/search';

const SiteHeader = () => {
  // Initialize keyboard shortcuts
  // useKeyboardShortcuts();

  const path = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const searchStore = useSearchStore();

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY < 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hideHeader =
    isScrolled && path.startsWith('/watch') && !searchStore.isOpen;

  return (
    // <header className="sticky top-0 z-50 border-b bg-background">
    <header className={`sticky top-0 z-50 ${hideHeader ? 'hidden' : ''}`}>
      <MainNav items={siteConfig.mainNav} />
      {/* <MobileNav items={siteConfig.mainNav} className="md:hidden" /> */}
    </header>
  );
};

export default SiteHeader;
