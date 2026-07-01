'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmbedPlayer from './embed-player';
import { MediaType } from '@/types';
import { Icons } from '@/components/icons';
import { siteConfig } from '@/configs/site';

interface PlayerOption {
  id: string;
  name: string;
  url: string;
  description?: string;
  language?: string;
  ad?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  quality?: string;
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

const PlayerSelector = ({
  mediaId,
  mediaType,
  playerClass,
  selectorClass,
  season,
  episode,
  title,
  onPlayerChange,
}: PlayerSelectorProps) => {
  const router = useRouter();
  const [activePlayer, setActivePlayer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [zxcOnline, setZxcOnline] = useState<boolean | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const getHindiServers = () => {
    if (mediaType === 'anime') return [];
    const s = season || 1;
    const e = episode || 1;

    if (mediaType === 'movie') {
      return [
        { name: 'ZxcStream', url: `https://zxcstream.xyz/player/movie/${mediaId}?dubLang=hi` },
        { name: 'VidSrc.pk', url: `https://embed.vidsrc.pk/movie/${mediaId}?src=1` },
        { name: 'VidEasy', url: `https://player.videasy.net/movie/${mediaId}` },
      ];
    } else {
      return [
        { name: 'ZxcStream', url: `https://zxcstream.xyz/player/tv/${mediaId}/${s}/${e}?dubLang=hi` },
        { name: 'VidSrc.pk', url: `https://embed.vidsrc.pk/tv/${mediaId}/${s}/${e}?src=1` },
        { name: 'VidEasy', url: `https://player.videasy.net/tv/${mediaId}/${s}/${e}` },
      ];
    }
  };

  const hindiServers = React.useMemo(() => getHindiServers(), [mediaId, mediaType, season, episode]);


  React.useEffect(() => {
    fetch('https://zxcstream.xyz', { mode: 'no-cors', cache: 'no-store' })
      .then(() => setZxcOnline(true))
      .catch(() => setZxcOnline(false));
  }, []);

  React.useEffect(() => {
    if (zxcOnline === false) {
      setActivePlayer(0);
    }
  }, [zxcOnline]);

  const buildUrl = (baseUrl: string): string => {
    // For providers that expect query params, append season/episode when available
    if ((mediaType === 'tv' || mediaType === 'anime') && season && episode) {
      if (baseUrl.includes('?')) {
        return `${baseUrl}&season=${season}&episode=${episode}`;
      }
      return `${baseUrl}?season=${season}&episode=${episode}`;
    }
    return baseUrl;
  };

  const getPlayerOptions = (): PlayerOption[] => {
    if (!mediaId) return [];

    const baseOptions: PlayerOption[] = [
      // {
      //   id: 'vidsrc-cc-v3',
      //   name: 'VidCloud',
      //   url: `https://vidsrc.cc/v3/embed/${mediaType}/${mediaId}?autoPlay=true`,
      //   description: 'Native streaming quality',
      //   language: 'Original',
      //   ad: false,
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'vidsrc',
      //   name: 'VidSrc.pk',
      //   url: `https://embed.vidsrc.pk/${mediaType}/${mediaId}`,
      //   description: 'Possible Hindi Dubbed Available',
      //   language: 'Hindi',
      //   ad: false,
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'vidsrc-to',
      //   name: 'VidSrc.to',
      //   url: `https://vidsrc.to/embed/${mediaType}/${mediaId}`,
      //   description: 'Alternative streaming source',
      //   language: 'Original',
      //   ad: false,
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'vidsrc-cc-v2',
      //   name: 'VidPlay',
      //   url: `https://vidsrc.cc/v2/embed/${mediaType}/${mediaId}?autoPlay=true`,
      //   description: 'Native streaming quality',
      //   language: 'Original',
      //   ad: false,
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'autoembed',
      //   name: 'AutoEmbed',
      //   url: `https://player.autoembed.cc/embed/${mediaType}/${mediaId}?server=2`,
      //   description: 'Possible Hindi Dubbed Available',
      //   language: 'Hindi Option',
      //   ad: true,
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'vidfast',
      //   name: 'VidFast',
      //   url: `https://vidfast.pro/${mediaType}/${mediaId}?autoPlay=true`,
      //   description: 'Possible Hindi Dubbed Available',
      //   language: 'Hindi Option',
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'videasy',
      //   name: 'VidEasy',
      //   url: `https://player.videasy.net/${mediaType}/${mediaId}`,
      //   description: 'hindi option and anime available',
      //   language: 'Hindi Option',
      //   icon: Icons.play,
      //   quality: 'HD'
      // },
      // {
      //   id: 'multiembed',
      //   name: 'Multi',
      //   url: `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1`,
      //   description: 'hindi option and anime available',
      //   language: 'Original',
      //   icon: Icons.play,
      //   quality: 'HD'
      // }
    ];

    if (mediaType === 'movie') {
      if (zxcOnline !== false) {
        baseOptions.push(
          {
            id: 'zxcstream',
            name: 'ZxcStream',
            url: `https://zxcstream.xyz/player/${mediaType}/${mediaId}?dubLang=hi`,
            description: 'Default streaming server',
            language: 'Hindi',
            icon: Icons.play,
            quality: 'HD',
          }
        );
      }
      if (zxcOnline === false) {
        baseOptions.push(
          {
            id: 'vidify-fallback',
            name: 'Vidify',
            url: buildUrl(`https://player.vidify.top/embed/movie/${mediaId}?autoplay=true&pip=true&logourl=${siteConfig.url}/logo.png&download=true`),
            description: 'Fallback streaming server',
            language: 'Original',
            icon: Icons.play,
            quality: 'HD',
          }
        );
      }
    }

    if (mediaType === 'tv') {
      if (zxcOnline !== false) {
        baseOptions.push(
          {
            id: 'zxcstream',
            name: 'ZxcStream',
            url: `https://zxcstream.xyz/player/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?dubLang=hi`,
            description: 'Default streaming server',
            language: 'Hindi',
            icon: Icons.play,
            quality: 'HD',
          }
        );
      }
      if (zxcOnline === false) {
        baseOptions.push(
          {
            id: 'vidify-fallback',
            name: 'Vidify',
            url: buildUrl(
              `https://player.vidify.top/embed/tv/${mediaId}/${season || 1}/${episode || 1}?autoplay=true&pip=true&logourl=${siteConfig.url}/logo.png&download=true`,
            ),
            description: 'Fallback streaming server',
            language: 'Original',
            icon: Icons.play,
            quality: 'HD',
          }
        );
      }
    }

    // console.log("animepage =", "mediaType-", mediaType, "mediaId-", mediaId, "episode-", episode )

    if (mediaType === 'anime') {
      baseOptions.push(
        {
          id: 'vidsrc',
          name: 'VidSrc.pk',
          url: buildUrl(
            `https://embed.vidsrc.pk/tv/${mediaId}/${season || 1}-${episode || 1}`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidnest',
          name: 'VidNest',
          url: buildUrl(
            `https://vidnest.fun/${mediaType}/${mediaId}/${season || 1}/${episode || 1}`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidnest-hindi',
          name: 'VidNest',
          url: buildUrl(
            `https://vidnest.fun/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?server=delta`,
          ),
          description: 'Hindi Dubbed Available',
          language: 'Hindi',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidfast',
          name: 'VidFast',
          url: buildUrl(
            `https://vidfast.pro/tv/${mediaId}/${season || 1}/${episode || 1}?nextButton=true&autoNext=true&autoPlay=true`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'videasy',
          name: 'VidEasy (Anime)',
          url: buildUrl(
            `https://player.videasy.net/${mediaType}/${mediaId}/${episode || 1}?dub=true|false`,
          ),
          description: 'hindi option and anime available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'autoembed',
          name: 'AutoEmbed (Anime)',
          url: buildUrl(
            `https://player.autoembed.cc/embed/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?server=2`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          ad: true,
          icon: Icons.play,
          quality: 'HD',
        },
      );

      // TV fallbacks for anime (some providers resolve better via TV endpoints)
      baseOptions.push(
        {
          id: 'vidsrc-to-tv',
          name: 'VidSrc.to (TV Fallback)',
          url: buildUrl(
            `https://vidsrc.to/embed/tv/${mediaId}/${season || 1}/${episode || 1}`,
          ),
          description: 'Fallback via TV endpoint',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
      );
    }

    return baseOptions;
  };

  const playerOptions = React.useMemo(() => getPlayerOptions(), [
    mediaId,
    mediaType,
    season,
    episode,
    zxcOnline,
  ]);

  const currentServer = hindiServers.find(s => s.url === activeUrl);
  const currentServerName = currentServer ? currentServer.name : 'Select Hindi Server';

  React.useEffect(() => {
    if (playerOptions[activePlayer]) {
      setActiveUrl(playerOptions[activePlayer].url || '');
    }
  }, [activePlayer, playerOptions]);

  React.useEffect(() => {
    if (onPlayerChange && playerOptions[activePlayer]) {
      onPlayerChange(playerOptions[activePlayer].id);
    }
  }, [activePlayer, playerOptions, onPlayerChange]);



  if (!playerOptions.length) {
    return (
      <div className="flex w-full items-center justify-center p-8 text-neutral-400">
        No players available for this content.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className={`relative w-full ${selectorClass}`}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="text-white">Loading player...</div>
          </div>
        )}
        <EmbedPlayer
          key={`${activePlayer}-${activeUrl}`}
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
        />

        {mediaType !== 'anime' && (
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
            onMouseLeave={() => setIsOpen(false)}
          >
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/80 px-4 py-2 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-zinc-900 cursor-pointer md:text-xs"
            >
              <span>{currentServerName}</span>
              <Icons.chevronDown className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full mt-1.5 w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-lg">
                {hindiServers.map((server) => (
                  <button
                    key={server.name}
                    onClick={() => {
                      setActiveUrl(server.url);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-[10px] font-medium transition-colors cursor-pointer hover:bg-neutral-800 md:text-xs ${
                      activeUrl === server.url
                        ? 'bg-blue-600/20 text-blue-400 font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {zxcOnline !== false && mediaType !== 'anime' && (
        <div className="relative mt-4 mb-2 flex justify-center">
          <button
            onClick={() => router.push(`/download/${mediaType}/${mediaId}`)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900/60 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:border-white/25 hover:bg-zinc-800/80 active:scale-95 cursor-pointer"
            title="Download Movie/Show"
          >
            <Icons.download className="h-5 w-5" />
            <span>Download HD</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerSelector;
