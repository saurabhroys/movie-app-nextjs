'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function ServerRecommendationSwitch({
  text = '',
  switchClass = '',
  tooltipText = '',
}: {
  text?: string;
  switchClass?: string;
  tooltipText?: string;
}) {
  const [serverRecommendationEnabled, setServerRecommendationEnabled] =
    React.useState<boolean>(true);

  // Initialize server recommendation flag from localStorage (default true on first visit)
  React.useEffect(() => {
    try {
      const key = 'serverRecommandationSystem';
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (stored === null) {
        window.localStorage.setItem(key, 'true');
        setServerRecommendationEnabled(true);
      } else {
        const enabled = stored === 'true';
        setServerRecommendationEnabled(enabled);
      }
    } catch {
      // If localStorage fails, keep default true
      setServerRecommendationEnabled(true);
    }
  }, []);

  return (
    <div className={`${switchClass} ${!switchClass ? 'space-x-2' : ''}`}>
      <Switch
        id="airplane-mode"
        data-tooltip={tooltipText}
        checked={serverRecommendationEnabled}
        onCheckedChange={(checked) => {
          try {
            window.localStorage.setItem(
              'serverRecommandationSystem',
              String(checked),
            );
          } catch {}
          setServerRecommendationEnabled(checked);
        }}
      />
      <Label htmlFor="airplane-mode">{text}</Label>
    </div>
  );
}
