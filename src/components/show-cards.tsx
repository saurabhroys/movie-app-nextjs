import { useModalStore } from '@/stores/modal';
import { MediaType, type Show } from '@/types';
import * as React from 'react';

import { getNameFromShow, getSlug } from '@/lib/utils';
import CustomImage from './custom-image';

interface ShowCardProps {
  show: Show;
  pathname: string;
}

export const ShowCard = ({ show, pathname }: ShowCardProps) => {
    const imageOnErrorHandler = (
      event: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      event.currentTarget.src = '/images/grey-thumbnail.jpg';
    };
  
    return (
      <picture className="relative aspect-video">
        <a
          className="pointer-events-none"
          aria-hidden={false}
          role="link"
          aria-label={getNameFromShow(show)}
          href={`/${show.media_type}/${getSlug(show.id, getNameFromShow(show))}`}
        />
        <CustomImage
          src={
            (show.backdrop_path ?? show.poster_path)
              ? `https://image.tmdb.org/t/p/w780${
                  show.backdrop_path ?? show.poster_path
                }`
              : '/images/grey-thumbnail.jpg'
          }
          alt={show.title ?? show.name ?? 'poster'}
          className="h-full w-full cursor-pointer rounded-lg px-1 transition-all"
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
          style={{
            objectFit: 'cover',
          }}
          onClick={() => {
            const name = getNameFromShow(show);
            const path: string =
              show.media_type === MediaType.TV ? 'tv-shows' : 'movies';
            window.history.pushState(
              null,
              '',
              `${path}/${getSlug(show.id, name)}`,
            );
            useModalStore.setState({
              show: show,
              open: true,
              play: true,
            });
          }}
          onError={imageOnErrorHandler}
        />
      </picture>
    );
  };