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
} from "@/components/ui/tooltip"

interface PlayerOption {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  quality?: string;
}

interface PlayerSelectorProps {
  movieId: string;
  mediaType: 'movie' | 'tv' | 'anime';
}

const PlayerSelector = ({ movieId, mediaType }: PlayerSelectorProps) => {
  const [activePlayer, setActivePlayer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const getPlayerOptions = (): PlayerOption[] => {
    if (!movieId) return [];
    
    const baseOptions: PlayerOption[] = [
      {
        id: 'autoembed',
        name: 'AutoEmbed',
        url: `https://player.autoembed.cc/embed/${mediaType}/${movieId}?server=2`,
        description: 'Possible Hindi Dubbed Available',
        icon: Icons.play,
        quality: 'HD'
      },
      {
        id: 'vidsrc',
        name: 'VidSrc',
        url: `https://embed.vidsrc.pk/${mediaType}/${movieId}`,
        description: 'Possible Hindi Dubbed Available',
        icon: Icons.play,
        quality: 'HD'
      },
      {
        id: 'vidsrc-cc',
        name: 'VidSrc.cc',
        url: `https://vidsrc.cc/embed/${mediaType}/${movieId}`,
        description: 'Native streaming quality  ',
        icon: Icons.play,
        quality: 'SD'
      }
    ];

    if (mediaType === 'movie') {
      baseOptions.push({
        id: 'superembed',
        name: 'SuperEmbed',
        url: `https://superembed.stream/e/${movieId}`,
        description: 'Premium streaming quality',
        icon: Icons.play,
        quality: '4K'
      });
    }

    return baseOptions;
  };

  const playerOptions = getPlayerOptions();

  const handlePlayerChange = (index: number) => {
    setIsLoading(true);
    setActivePlayer(index);
    console.log('Switching to player:', playerOptions[index]?.name, 'URL:', playerOptions[index]?.url);
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!playerOptions.length) {
    return (
      <div className="bg-black/90 backdrop-blur-sm border-t border-gray-800">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Choose Stream</h3>
          <p className="text-gray-400">No players available for this content.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-black/90 backdrop-blur-sm border-t border-gray-800">
        
        <div className="relative h-screen">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-white">Loading player...</div>
            </div>
          )}
          <EmbedPlayer 
            key={`${activePlayer}-${playerOptions[activePlayer]?.id}`}
            url={playerOptions[activePlayer]?.url || ''} 
            movieId={mediaType === 'anime' ? movieId : undefined}
            mediaType={mediaType === 'anime' ? MediaType.ANIME : undefined}
          />
        </div>
        
        <div className="pt-2 px-4 w-full">
          {playerOptions[activePlayer]?.description && (
            <p className="text-gray-400 text-sm mb-4 text-center">
              {playerOptions[activePlayer].description}
            </p>
          )}
        </div>

        <div className="p-4 flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Choose Stream</h3>
            <div className="flex flex-wrap gap-3 mb-4 justify-center">
              {playerOptions.map((option, index) => {
                const IconComponent = option.icon || Icons.play;
                return (
                  <Tooltip key={option.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handlePlayerChange(index)}
                        disabled={isLoading}
                        className={`group relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 min-w-[120px] ${
                          activePlayer === index
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                            : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:scale-105'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{option.name}</span>
                        {option.quality && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            option.quality === '4K' 
                              ? 'bg-purple-600 text-white' 
                              : option.quality === 'HD'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-200'
                          }`}>
                            {option.quality}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-center">
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-gray-300 mt-1">{option.description}</p>
                        {option.quality && (
                          <p className="text-xs text-gray-400 mt-1">Quality: {option.quality}</p>
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
