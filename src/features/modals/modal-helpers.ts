import { type VideoResult } from '@/services/tmdb/types';

/**
 * Shared helpers for the preview and hover modals so the trailer/YouTube
 * behaviour stays consistent between the two surfaces.
 */

/** Picks the first official trailer video key from a list of TMDb results. */
export function selectTrailerKey(results: VideoResult[] | undefined): string {
  return (
    results?.find((v: VideoResult) => v.type === 'Trailer')?.key ?? ''
  );
}

export interface YoutubePlayerVars {
  /** 1 = loop the trailer, 0 = play once (hover cards loop, preview plays once). */
  loop?: 0 | 1;
  /** 1 = allow "playsinline" on mobile (desktop preview), 0 = force fullscreen-ish (hover). */
  playsinline?: 0 | 1;
}

/** Builds the shared YouTube player options used by both modals. */
export function makeYoutubeOptions({ loop = 0, playsinline = 1 }: YoutubePlayerVars = {}) {
  return {
    // https://developers.google.com/youtube/player_parameters
    playerVars: {
      rel: 0,
      mute: 0,
      loop,
      autoplay: 1,
      controls: 0,
      showinfo: 0,
      disablekb: 1,
      enablejsapi: 1,
      playsinline,
      cc_load_policy: 0,
      modestbranding: 0,
    },
  } as const;
}
