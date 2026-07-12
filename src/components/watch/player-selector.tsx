'use client';

import React, { useState } from 'react';
import EmbedPlayer from './embed-player';
import DownloadButton from './download-button';
import { MediaType } from '@/types';
import { Icons } from '@/components/icons';
import { siteConfig } from '@/configs/site';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

interface PlayerOption {
  id: string;
  name: string;
}

interface PlayerSelectorProps {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  playerClass: string;
  selectorClass: string;
  season?: number;
  episode?: number;
  title?: string;
  onPlayerChange?: (playerId: string) => void;
}

const TV_MOVIE_PLAYERS: PlayerOption[] = [
  { id: 'netflix-live', name: 'Netflix Live' },
  { id: 'vidify', name: 'Vidify' },
  { id: 'vidsrc-to', name: 'Vidsrc.to' },
  { id: 'vsembed', name: 'VsEmbed' },
  { id: 'vidsrc-pk', name: 'VidSrc.pk' },
];

const ANIME_PLAYERS: PlayerOption[] = [
  { id: 'vidsrc-anime', name: 'VidSrc.pk' },
  { id: 'vidnest-anime', name: 'VidNest' },
  { id: 'vidnest-delta-anime', name: 'VidNest (Delta)' },
  { id: 'vidfast-anime', name: 'VidFast' },
  { id: 'videasy-anime', name: 'VidEasy' },
  { id: 'autoembed-anime', name: 'AutoEmbed' },
  { id: 'vidsrc-to-tv-anime', name: 'VidSrc.to' },
];

const buildPlayerUrl = (
  playerId: string,
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string,
  season: number,
  episode: number,
): string => {
  const s = season || 1;
  const e = episode || 1;

  switch (playerId) {
    // TV/Movie Players
    case 'netflix-live':
      const netflixPath = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}/${s}/${e}`;
      return `https://z.zxcstream.xyz/player/${netflixPath}?dubLang=hi&autoplay=true`;
    case 'vidify':
      const vidifyPath = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}/${s}/${e}`;
      return `https://player.vidify.top/embed/${vidifyPath}?autoplay=true&pip=true&logourl=${siteConfig.url}/logo.png&download=true`;
    case 'vidsrc-to':
      const toPath = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}/${s}/${e}`;
      return `https://vidsrc.to/embed/${toPath}`;
    case 'vsembed':
      const vsembedPath = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}/${s}-${e}`;
      return `https://vsembed.ru/embed/${vsembedPath}`;
    case 'vidsrc-pk':
      const pkPath = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}/${s}-${e}`;
      return `https://embed.vidsrc.pk/${pkPath}?src=1`;

    // Anime Players
    case 'vidsrc-anime':
      return `https://embed.vidsrc.pk/tv/${mediaId}/${s}-${e}`;
    case 'vidnest-anime':
      return `https://vidnest.fun/anime/${mediaId}/${s}/${e}`;
    case 'vidnest-delta-anime':
      return `https://vidnest.fun/anime/${mediaId}/${s}/${e}?server=delta`;
    case 'vidfast-anime':
      return `https://vidfast.pro/tv/${mediaId}/${s}/${e}?nextButton=true&autoNext=true&autoPlay=true`;
    case 'videasy-anime':
      return `https://player.videasy.net/anime/${mediaId}/${e}?dub=true|false`;
    case 'autoembed-anime':
      return `https://player.autoembed.cc/embed/anime/${mediaId}/${s}/${e}?server=2`;
    case 'vidsrc-to-tv-anime':
      return `https://vidsrc.to/embed/tv/${mediaId}/${s}/${e}`;

    default:
      return '';
  }
};

const PlayerSelector = ({
  mediaId,
  mediaType,
  playerClass,
  selectorClass,
  season,
  episode,
  onPlayerChange,
}: PlayerSelectorProps) => {
  const [zxcOnline, setZxcOnline] = useState<boolean | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  const resetTimer = React.useCallback(() => {
    setShowControls(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  React.useEffect(() => {
    // Initial timer
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);

    const handleActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('pointermove', handleActivity);
    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('blur', handleActivity);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('pointermove', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('blur', handleActivity);
    };
  }, [resetTimer]);

  React.useEffect(() => {
    fetch('https://zxcstream.xyz', { mode: 'no-cors', cache: 'no-store' })
      .then(() => setZxcOnline(true))
      .catch(() => setZxcOnline(false));
  }, []);

  const players = React.useMemo(() => {
    if (mediaType === 'anime') {
      return ANIME_PLAYERS;
    }
    return TV_MOVIE_PLAYERS.filter((player) => {
      if (player.id === 'netflix-live') return zxcOnline !== false;
      if (player.id === 'vidify') return zxcOnline === false;
      return true;
    });
  }, [mediaType, zxcOnline]);

  // Set default/first player on initialization or change in list
  React.useEffect(() => {
    if (players.length > 0) {
      const exists = players.some((p) => p.id === activePlayerId);
      if (!exists) {
        setActivePlayerId(players[0].id);
      }
    }
  }, [players, activePlayerId]);

  const activeUrl = React.useMemo(() => {
    if (!activePlayerId) return '';
    return buildPlayerUrl(activePlayerId, mediaType, mediaId, season || 1, episode || 1);
  }, [activePlayerId, mediaType, mediaId, season, episode]);

  React.useEffect(() => {
    if (onPlayerChange && activePlayerId) {
      onPlayerChange(activePlayerId);
    }
  }, [activePlayerId, onPlayerChange]);

  const currentServerName = players.find((p) => p.id === activePlayerId)?.name || 'Select Server';

  if (!players.length) {
    return (
      <div className="flex w-full items-center justify-center p-8 text-neutral-400">
        No players available for this content.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`relative w-full ${selectorClass}`}>
        {/* Transparent full-screen overlay to catch mouse & tap events when controls are hidden */}
        {!showControls && (
          <div
            className="absolute inset-0 z-30 bg-transparent cursor-default"
            onMouseMove={resetTimer}
            onClick={resetTimer}
            onTouchStart={resetTimer}
            onPointerMove={resetTimer}
            onPointerDown={resetTimer}
          />
        )}

        <EmbedPlayer
          key={`${activePlayerId}-${activeUrl}`}
          url={activeUrl}
          mediaId={mediaId}
          mediaType={
            mediaType === 'anime'
              ? MediaType.ANIME
              : mediaType === 'tv'
                ? MediaType.TV
                : MediaType.MOVIE
          }
          playerClass={playerClass}
          showControls={showControls}
        />

        <div
          ref={dropdownRef}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-opacity duration-500 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
              setIsOpen(true);
            }
          }}
          onMouseLeave={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
              setIsOpen(false);
            }
          }}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-2 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-zinc-900 cursor-pointer md:text-xs"
          >
            <span>{currentServerName}</span>
            <Icons.chevronDown
              className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full pt-1.5 w-48 z-50">
              <div className="rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-lg">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setActivePlayerId(player.id);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-[10px] font-medium transition-colors cursor-pointer hover:bg-neutral-800 md:text-xs ${
                      player.id === activePlayerId
                        ? 'bg-red-600/20 text-red-500 font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DownloadButton mediaId={mediaId} mediaType={mediaType} zxcOnline={zxcOnline} />
    </div>
  );
};

export default PlayerSelector;
