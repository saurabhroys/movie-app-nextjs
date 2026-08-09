import React, { Suspense } from 'react';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';

import { Analytics } from '@/components/shared/analytics';
import { siteConfig } from '@/configs/site';
import { env } from '@/env';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import SiteHeader from '@/components/layout/site-header';
import GlobalShortcutsWrapper from '@/components/providers/global-shortcuts-wrapper';
import { TrpcProvider } from '@/components/providers/trpc-provider';
import SiteFooter from '@/components/layout/site-footer';
import { StoreProvider } from '@/components/providers/store-provider';
import AttributeTooltipManager from '@/components/shared/attribute-tooltip';
import Modals from '@/components/modals';
import localFont from 'next/font/local';

const inter = localFont({
  src: [
    { path: '../assets/fonts/Inter-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/Inter-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const calSans = localFont({
  src: [
    { path: '../assets/fonts/CalSans-SemiBold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
});

// export const runtime = 'edge';



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
    <html lang="en" className={cn(inter.variable, calSans.variable, 'dark')} suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen overflow-x-hidden overflow-y-auto bg-white font-sans antialiased dark:bg-[#141414]'
        )}>
        <TrpcProvider>
          <StoreProvider>
            <Suspense fallback={<div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" />}>
              <SiteHeader />
            </Suspense>
            <GlobalShortcutsWrapper />
            <Suspense fallback={null}>
              {children}
            </Suspense>
            <Modals />
            <SiteFooter />
            <TailwindIndicator />
            <Analytics />
            {process.env.NODE_ENV === 'production' && <SpeedInsights />}
            <AttributeTooltipManager />
            {env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', '${env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
                  `}
                </Script>
              </>
            )}
          </StoreProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
