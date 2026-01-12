'use client';

import React from 'react';
import { MediaType, type Show } from '@/types';
import ShowsGrid from '@/components/shows-grid';
import { useSearchStore } from '@/stores/search';
import { handleDefaultSearchBtn, handleDefaultSearchInp, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SearchContainerProps {
  query: string;
  shows: Show[];
}

function SearchContainer({ shows, query }: SearchContainerProps) {
  const searchStore = useSearchStore();
  const [activeFilter, setActiveFilter] = React.useState<MediaType | 'all'>(
    'all',
  );

  React.useEffect(() => {
    searchStore.setIsOpen(true);
    searchStore.setQuery(query);
    searchStore.setShows(shows);
    const timer1: NodeJS.Timeout = setTimeout(() => {
      handleDefaultSearchBtn();
    }, 5);
    const timer2: NodeJS.Timeout = setTimeout(() => {
      handleDefaultSearchInp();
    }, 10);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [query, shows]);

  const filteredShows = React.useMemo(() => {
    if (activeFilter === 'all') return searchStore.shows;
    return searchStore.shows.filter((show) => {
      // In some cases, media_type might be anime if it's determined by the query or source
      if (activeFilter === MediaType.ANIME) {
        // Simple heuristic: check if genres contain animation (though not perfect)
        // or if it was tagged as anime by the service
        return (
          show.media_type === MediaType.ANIME ||
          (show.media_type === MediaType.TV &&
            show.name?.toLowerCase().includes('anime'))
        );
      }
      return show.media_type === activeFilter;
    });
  }, [searchStore.shows, activeFilter]);

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: MediaType.MOVIE },
    { label: 'TV Shows', value: MediaType.TV },
    { label: 'Anime', value: MediaType.ANIME },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="container mt-20 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-neutral-400">Filter by:</span>
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'rounded-full px-4 transition-all duration-300',
              activeFilter === filter.value
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'border-neutral-700 bg-transparent text-white hover:bg-neutral-800',
            )}
            onClick={() => setActiveFilter(filter.value as any)}>
            {filter.label}
          </Button>
        ))}
        {filteredShows.length > 0 && (
          <span className="ml-auto text-xs text-neutral-500">
            {filteredShows.length} results found
          </span>
        )}
      </div>

      <ShowsGrid 
        shows={filteredShows} 
        query={searchStore.query} 
      />
      
      {filteredShows.length === 0 && searchStore.shows.length > 0 && (
        <div className="container -mt-10 flex flex-col items-center justify-center py-20 text-center">
          <p className="mb-4 text-neutral-400">
            No {activeFilter === MediaType.ANIME ? 'anime' : activeFilter === MediaType.MOVIE ? 'movies' : 'TV shows'} found for this search.
          </p>
          <Button 
            variant="ghost" 
            className="text-white underline underline-offset-4 hover:bg-white/5"
            onClick={() => setActiveFilter('all')}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchContainer;
