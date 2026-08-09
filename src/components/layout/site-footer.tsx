import React from 'react';
import { siteConfig } from '@/configs/site';
// import Link from 'next/link';
// import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';

const SiteFooter = () => {
  return (
    <footer aria-label="Footer" className="w-full">
      {/* <div className="container grid w-full max-w-6xl gap-7 py-10">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {siteConfig.footerItems.map(
            (item, i) =>
              item.href && (
                <li
                  key={i}
                  className="text-foreground/60 text-xs hover:underline sm:text-sm">
                  <Link href={item.href}>{item.title}</Link>
                </li>
              ),
          )}
        </ul>
        <p className="text-foreground/60 text-xs sm:text-sm">
          @ 2023-{new Date().getFullYear()} {siteConfig.author}.
        </p>
      </div> */}
      <div className="container flex flex-col items-center justify-center gap-4 md:h-10 md:flex-row md:py-0">
        {/* copyright text */}
        <div className="flex h-20 items-center gap-2 px-8">
          <Icons.logo_long className="hidden h-6 w-auto md:block" />
          <p className="place-content-center text-center text-xs leading-loose sm:text-sm md:text-left">
            Made with ❤️ and dedication by{' '}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4">
              {' Saurabh '}
            </a>
            . Inspired by{' '}
            <a
              href={siteConfig.links.netflix}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4">
              Netflix
            </a>
            {'. Support '}
            <a
              href={siteConfig.links.buyMeACoffee}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1 font-medium underline underline-offset-4">
              <Icons.coffee className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              {'Me a Coffee'}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
