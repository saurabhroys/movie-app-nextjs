'use client';

import React, { useState } from 'react';
import EmbedPlayer from './embed-player';
import { MediaType } from '@/types';
import { Icons } from '@/components/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '../ui/button';

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
}

const PlayerSelector = ({
  mediaId,
  mediaType,
  playerClass,
  selectorClass,
  season,
  episode,
}: PlayerSelectorProps) => {
  const [activePlayer, setActivePlayer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      baseOptions.push(
        {
          id: 'vidify',
          name: 'Vidify',
          url: buildUrl(`https://player.vidify.top/embed/movie/${mediaId}?autoplay=true`),
          description: 'Multi-language supported',
          language: 'Original',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidify-hindi',
          name: 'Vidify',
          url: buildUrl(`https://player.vidify.top/embed/movie/${mediaId}?server=hindi&autoplay=true`),
          description: 'Multi-language supported',
          language: 'Hindi',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidfast',
          name: 'VidFast',
          url: buildUrl(
            `https://vidfast.pro/${mediaType}/${mediaId}?autoPlay=true`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidnest',
          name: 'VidNest',
          url: buildUrl(
            `https://vidnest.fun/${mediaType}/${mediaId}`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidnest-2',
          name: 'VidNest Hindi',
          url: buildUrl(
            `https://vidnest.fun/${mediaType}/${mediaId}?server=delta`,
          ),
          description: 'Hindi Dubbed Available',
          language: 'Hindi',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc',
          name: 'VidSrc.pk',
          url: buildUrl(`https://embed.vidsrc.pk/${mediaType}/${mediaId}`),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-cc-v3',
          name: 'VidCloud',
          url: buildUrl(
            `https://vidsrc.cc/v3/embed/${mediaType}/${mediaId}?autoPlay=true`,
          ),
          description: 'Native streaming quality',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-to',
          name: 'VidSrc.to',
          url: buildUrl(`https://vidsrc.to/embed/${mediaType}/${mediaId}`),
          description: 'Alternative streaming source',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-cc-v2',
          name: 'VidPlay',
          url: buildUrl(
            `https://vidsrc.cc/v2/embed/${mediaType}/${mediaId}?autoPlay=true`,
          ),
          description: 'Native streaming quality',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'autoembed',
          name: 'AutoEmbed',
          url: buildUrl(
            `https://player.autoembed.cc/embed/${mediaType}/${mediaId}?server=2`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
          ad: true,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'videasy',
          name: 'VidEasy',
          url: buildUrl(`https://player.videasy.net/${mediaType}/${mediaId}`),
          description: 'hindi option and anime available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'multiembed',
          name: 'Multi',
          url: buildUrl(
            `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1`,
          ),
          description: 'hindi option and anime available',
          language: 'Original',
          icon: Icons.play,
          quality: 'HD',
        },
      );
    }

    if (mediaType === 'tv') {
      baseOptions.push(
        {
          id: 'vidify',
          name: 'Vidify',
          url: buildUrl(
            `https://player.vidify.top/embed/tv/${mediaId}/${season || 1}/${episode || 1}?autoplay=true`,
          ),
          description: 'Multi-language supported',
          language: 'Original',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidify-hindi',
          name: 'Vidify',
          url: buildUrl(
            `https://player.vidify.top/embed/tv/${mediaId}/${season || 1}/${episode || 1}?server=hindi&autoplay=true`,
          ),
          description: 'Multi-language servers',
          language: 'Hindi',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidfast',
          name: 'VidFast',
          url: buildUrl(
            `https://vidfast.pro/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?autoPlay=true`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi Option',
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
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidnest-2',
          name: 'VidNest',
          url: buildUrl(
            `https://vidnest.fun/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?server=delta`,
          ),
          description: 'Hindi Dubbed Available',
          language: 'Hindi',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc',
          name: 'VidSrc.pk',
          url: buildUrl(
            `https://embed.vidsrc.pk/${mediaType}/${mediaId}/${season || 1}-${episode || 1}`,
          ),
          description: 'Possible Hindi Dubbed Available',
          language: 'Hindi',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-cc-v3',
          name: 'VidCloud',
          url: buildUrl(
            `https://vidsrc.cc/v3/embed/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?autoPlay=true`,
          ),
          description: 'Native streaming quality',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-to',
          name: 'VidSrc.to',
          url: buildUrl(
            `https://vidsrc.to/embed/${mediaType}/${mediaId}/${season || 1}/${episode || 1}`,
          ),
          description: 'Alternative streaming source',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-cc-v2',
          name: 'VidPlay',
          url: buildUrl(
            `https://vidsrc.cc/v2/embed/${mediaType}/${mediaId}/${season || 1}/${episode || 1}?autoPlay=true`,
          ),
          description: 'Native streaming quality',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'videasy',
          name: 'VidEasy',
          url: buildUrl(
            `https://player.videasy.net/${mediaType}/${mediaId}/${season || 1}/${episode || 1}`,
          ),
          description: 'hindi option and anime available',
          language: 'Hindi Option',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'multiembed',
          name: 'Multi',
          url: buildUrl(
            `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1&s=${season || 1}&e=${episode || 1}`,
          ),
          description: 'hindi option and anime available',
          language: 'Original',
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'autoembed',
          name: 'AutoEmbed',
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
    }

    // console.log("animepage =", "mediaType-", mediaType, "mediaId-", mediaId, "episode-", episode )

    if (mediaType === 'anime') {
      baseOptions.push(
        {
          id: 'multiembed',
          name: 'Multi',
          url: buildUrl(
            `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1&s=${season || 1}&e=${episode || 1}`,
          ),
          description: 'hindi option and anime available',
          language: 'Original',
          icon: Icons.play,
          quality: 'HD',
        },
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
          id: 'vidsrc-cc-v2',
          name: 'VidSrc.cc-v2 (Anime)',
          url: buildUrl(
            `https://vidsrc.cc/v2/embed/${mediaType}/${mediaId}/${episode || 1}sub?autoPlay=true`,
          ),
          description: 'Native streaming quality',
          language: 'Original',
          ad: false,
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
          id: 'vidsrc-cc-v3-tv',
          name: 'VidCloud (TV Fallback)',
          url: buildUrl(
            `https://vidsrc.cc/v3/embed/tv/${mediaId}/${season || 1}/${episode || 1}?autoPlay=true`,
          ),
          description: 'Fallback via TV endpoint',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'vidsrc-cc-v2-tv',
          name: 'VidPlay (TV Fallback)',
          url: buildUrl(
            `https://vidsrc.cc/v2/embed/tv/${mediaId}/${season || 1}/${episode || 1}?autoPlay=true`,
          ),
          description: 'Fallback via TV endpoint',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'autoembed-tv',
          name: 'AutoEmbed (TV Fallback)',
          url: buildUrl(
            `https://player.autoembed.cc/embed/tv/${mediaId}/${season || 1}/${episode || 1}?server=2`,
          ),
          description: 'Fallback via TV endpoint',
          language: 'Original',
          ad: true,
          icon: Icons.play,
          quality: 'HD',
        },
        {
          id: 'videasy-tv',
          name: 'VidEasy (TV Fallback)',
          url: buildUrl(
            `https://player.videasy.net/tv/${mediaId}/${season || 1}/${episode || 1}`,
          ),
          description: 'Fallback via TV endpoint',
          language: 'Original',
          ad: false,
          icon: Icons.play,
          quality: 'HD',
        },
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

  const playerOptions = getPlayerOptions();

  const handlePlayerChange = (index: number) => {
    setIsLoading(true);
    setActivePlayer(index);
    // console.log('Switching to player:', playerOptions[index]?.name, 'URL:', playerOptions[index]?.url);
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!playerOptions.length) {
    return (
      <div className="backdrop-blur-sm">
        <div className="p-4">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Choose Server
          </h3>
          <p className="text-neutral-400">
            No players available for this content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="backdrop-blur-sm">
        <div className={`relative ${selectorClass}`}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <div className="text-white">Loading player...</div>
            </div>
          )}
          <EmbedPlayer
            key={`${activePlayer}-${playerOptions[activePlayer]?.id}`}
            url={playerOptions[activePlayer]?.url || ''}
            mediaId={mediaType === 'anime' ? mediaId : undefined}
            mediaType={mediaType === 'anime' ? MediaType.ANIME : undefined}
            playerClass={playerClass}
          />
        </div>

        <div className="w-full px-4 pt-2">
          {playerOptions[activePlayer]?.description && (
            <p className="mb-4 text-center text-sm text-neutral-400">
              {playerOptions[activePlayer].description}
            </p>
          )}
        </div>

        <div className="flex w-screen flex-col items-center justify-center px-4">
          <h3 className="mb-4 text-center text-lg font-semibold text-white">
            Choose Server
          </h3>
          <div className="mb-4 flex flex-wrap justify-center gap-4">
            {playerOptions.map((option, index) => {
              const IconComponent = option.icon || Icons.play;
              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handlePlayerChange(index)}
                      disabled={isLoading}
                      className={`group relative flex min-w-[120px] items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                        activePlayer === index
                          ? 'bg-neutral-900 text-white shadow-lg ring-2 shadow-blue-500 ring-blue-500 hover:bg-neutral-900'
                          : 'border bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800'
                      }`}>
                      <IconComponent className="h-4 w-4" />
                      <span>{option.name}</span>
                      {option.quality && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            option.quality === '4K'
                              ? 'bg-purple-600 text-white'
                              : option.quality === 'HD'
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-950 text-neutral-200'
                          }`}>
                          {option.quality}
                        </span>
                      )}

                      <span className="absolute -top-3 left-3">
                        {option.language && (
                          <span
                            className={`rounded-md border border-neutral-800 px-2 py-px text-xs backdrop-blur-md ${
                              option.language === 'Hindi'
                                ? 'bg-white/90 text-black'
                                : option.language === 'Hindi Option'
                                  ? 'bg-neutral-300/80 text-black'
                                  : 'bg-neutral-950/90 text-neutral-200'
                            }`}>
                            {option.language}
                          </span>
                        )}
                      </span>
                      <span className="absolute -top-3 -right-1">
                        {option.ad && (
                          <span
                            className={`rounded-md border border-neutral-800 bg-red-600 px-2 py-[2px] text-[9px] backdrop-blur-md`}>
                            Ad 10s
                          </span>
                        )}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs border-0 bg-neutral-900">
                    <div className="text-center text-neutral-50">
                      <p className="font-medium">{option.name}</p>
                      <p className="mt-1 text-sm text-neutral-300">
                        {option.description}
                      </p>
                      {option.quality && (
                        <p className="mt-1 text-xs text-neutral-400">
                          Quality: {option.quality}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PlayerSelector;
