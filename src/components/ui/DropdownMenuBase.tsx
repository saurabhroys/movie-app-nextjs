import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@/components/compat/react19-compat';
import { type NavItem } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface DropdownMenuBaseProps {
  items: NavItem[];
  trigger: React.ReactNode;
  className?: string;
  onItemClick?: () => void;
  sideOffset?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A reusable dropdown menu component that renders navigation items
 * in a mobile-friendly Radix UI dropdown.
 */
export function DropdownMenuBase({
  items,
  trigger,
  className,
  onItemClick,
  sideOffset = 4,
  onOpenChange,
}: DropdownMenuBaseProps) {
  const pathname = usePathname();

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={sideOffset} className={cn('w-52', className)}>
        <DropdownMenuLabel />
        <DropdownMenuSeparator />
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild className="items-center justify-center">
            {item.href && (
              <Link href={item.href} onClick={onItemClick}>
                <span
                  className={cn(
                    'text-foreground/60 hover:text-foreground/80 line-clamp-1',
                    pathname === item.href && 'text-foreground font-bold',
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}