'use client';

import React from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const GlobalShortcuts: React.FC = () => {
  // This component only renders on the client due to dynamic import with ssr: false
  useKeyboardShortcuts();
  return null;
};

export default GlobalShortcuts;
