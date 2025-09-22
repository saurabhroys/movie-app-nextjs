'use client';

import React from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

const GlobalShortcuts: React.FC = () => {
  useKeyboardShortcuts();
  return null;
};

export default GlobalShortcuts;
