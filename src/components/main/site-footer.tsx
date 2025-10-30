import React from 'react';
import { siteConfig } from '@/configs/site';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const SiteFooter = () => {
  return (
    <footer aria-label="Footer" className="w-full">
      {/* <div className="container grid w-full max-w-6xl gap-7 py-10">
        <div className="flex flex-wrap items-center gap-2">
          {siteConfig.socialLinks.map(
            (item, i) =>
              item.href && (
                <Link key={i} href={item.href} target="_blank" rel="noreferrer">
                  <div
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'ghost',
                      className:
                        // "rounded-none text-neutral-700 hover:bg-transparent dark:text-neutral-50 dark:hover:bg-transparent",
                        'rounded-none hover:bg-transparent',
                    })}>
                    {item.icon && <item.icon className="h-6 w-6" />}
                    <span className="sr-only">{item.title}</span>
                  </div>
                </Link>
              ),
          )}
        </div>
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
            Made with ❤️ and dedication by{' Saurabh '}
            {/* <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              {siteConfig.author}
            </a> */}
            . Inspired by{' '}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4">
              Netflix
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
