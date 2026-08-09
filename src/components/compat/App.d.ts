// import React from 'react';
// import { DropdownMenuTrigger as RadixDropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
// import { Slot as RadixSlot } from '@radix-ui/react-slot';

// React 19 compatible helpers for Radix UI components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Existing elements
      div: React.DetailedHTMLProps<React.HostHTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      img: React.DetailedHTMLProps<React.HostHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
    }
  }
}

// Preserve existing exports in App.d.ts
export {};