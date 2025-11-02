'use client';

import dynamic from 'next/dynamic';

// Dynamically import GlobalShortcuts with no SSR to prevent router initialization issues
const GlobalShortcuts = dynamic(
  () => import('@/components/global-shortcuts'),
  { ssr: false }
);

export default function GlobalShortcutsWrapper() {
  return <GlobalShortcuts />;
}

