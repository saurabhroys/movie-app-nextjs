import React, { Suspense } from 'react';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';
// import { TrpcProvider } from '@/client/trpc-provider';
import type { Metadata, Viewport } from 'next';
import { Inter as FontSans } from 'next/font/google';
import localFont from 'next/font/local';
import { Analytics } from '@/components/analytics';
import { siteConfig } from '@/configs/site';
import { env } from '@/env.mjs';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import SiteHeader from '@/components/main/site-header';
import GlobalShortcutsWrapper from '@/components/global-shortcuts-wrapper';
import SiteFooter from '@/components/main/site-footer';
import AttributeTooltipManager from '@/components/attribute-tooltip';
import PreviewModal from '@/components/preview-modal';

// export const runtime = 'edge';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Font files can be colocated inside of `pages`
const fontHeading = localFont({
  src: '../assets/fonts/CalSans-SemiBold.woff2',
  variable: '--font-heading',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.author,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    images: siteConfig.ogImage,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.author,
  },
  icons: {
    icon: '/favicon.ico',
  },
  other: { referrer: 'no-referrer-when-downgrade' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
     <ThemeProvider>
      <head />
        <body
          suppressHydrationWarning
          className={cn(
            'min-h-screen overflow-x-hidden overflow-y-auto bg-white font-sans antialiased dark:bg-[#141414]',
            fontSans.variable,
            fontHeading.variable,
          )}>
          <Suspense fallback={<div className="h-16" />}>
            <SiteHeader />
          </Suspense>
          <GlobalShortcutsWrapper />
          {/* <TrpcProvider> */}
          <Suspense fallback={null}>
            {children}
          </Suspense>
          <PreviewModal />
          <SiteFooter />
          <TailwindIndicator />
          <Analytics />
          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
          <AttributeTooltipManager />
          {env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
            <GoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
          )}
          {/* </TrpcProvider> */}
        </body>
      </ThemeProvider>
    </html>
  );
}
