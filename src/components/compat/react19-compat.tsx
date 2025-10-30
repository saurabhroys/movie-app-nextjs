import React from 'react';
import { DropdownMenuTrigger as RadixDropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Slot as RadixSlot } from '@radix-ui/react-slot';

// Fix for React 19 "ref is now a regular prop" warning with Radix UI's DropdownMenuTrigger
export const DropdownMenuTrigger: React.FC<
  React.ComponentPropsWithRef<typeof RadixDropdownMenuTrigger>
> = ({ children, asChild, ...props }) => {
  // In React 19, ref is now a regular prop, not accessed via element.ref
  // This wrapper component helps avoid the warning
  return (
    <RadixDropdownMenuTrigger asChild={asChild} {...props}>
      {children}
    </RadixDropdownMenuTrigger>
  );
};

// React 19 compatible Slot component that wraps the Radix Slot
export const Slot: React.FC<React.ComponentPropsWithRef<typeof RadixSlot>> = ({
  children,
  ...props
}) => {
  return <RadixSlot {...props}>{children}</RadixSlot>;
};
