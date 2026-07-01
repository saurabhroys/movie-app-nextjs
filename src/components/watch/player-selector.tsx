'use client';

import React, { useState } from 'react';
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
  const [activePlayer, setActivePlayer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [zxcOnline, setZxcOnline] = useState<boolean | null>(null);
  const [urlOverride, setUrlOverride] = useState<string | null>(null);

  React.useEffect(() => {
    setUrlOverride(null);
  }, [activePlayer, season, episode, mediaId]);

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
    <div className={`relative w-full ${urlOverride ? '' : selectorClass}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading player...</div>
        </div>
      )}
      <EmbedPlayer
        key={`${activePlayer}-${urlOverride || playerOptions[activePlayer]?.id}`}
        url={urlOverride || playerOptions[activePlayer]?.url || ''}
        mediaId={mediaType === 'anime' ? mediaId : undefined}
        mediaType={mediaType === 'anime' ? MediaType.ANIME : undefined}
        playerClass={playerClass}
      />

      {zxcOnline !== false && mediaType !== 'anime' && (
        <button
          onClick={() => {
            if (urlOverride) {
              setUrlOverride(null);
            } else {
              setUrlOverride(`https://zxcstream.xyz/download/${mediaType}/${mediaId}`);
            }
          }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-zinc-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-500/30 transition-all duration-300 hover:scale-105 hover:bg-zinc-500 hover:shadow-zinc-500/40 active:scale-95 cursor-pointer"
          title={urlOverride ? "Back to Video Player" : "Download Movie/Show"}
        >
          {urlOverride ? (
            <>
              <Icons.play className="h-5 w-5" />
              <span>Back to Stream</span>
            </>
          ) : (
            <>
              <Icons.download className="h-5 w-5" />
              <span>Download HD</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PlayerSelector;
