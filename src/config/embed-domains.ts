/**
 * Video embed provider domains — single source of truth.
 *
 * Used by:
 * - `src/features/watch/player-selector.tsx` (buildPlayerUrl)
 * - `src/features/watch/embed-player.tsx` (Gemma postMessage target origin)
 * - `next.config.ts` (CSP `frame-src` / `connect-src` headers)
 *
 * Any new provider must be registered here so the CSP header stays in sync
 * with the players the app can actually load.
 */
export const GEMMA_DOMAIN = 'https://slast430did.com';
export const ZXCSTREAM_DOMAIN = 'https://zxcstream.cc';
export const VIDSTUCK_DOMAIN = 'https://vidstuck.cc';
export const VIDIFY_DOMAIN = 'https://player.vidify.top';
export const VIDSRC_TO_DOMAIN = 'https://vidsrc.to';
export const VIDSRC_EMBED_RU_DOMAIN = 'https://vidsrc-embed.ru';
export const VIDNEST_DOMAIN = 'https://vidnest.fun';
export const VIDFAST_DOMAIN = 'https://vidfast.pro';
export const VIDEASY_DOMAIN = 'https://player.videasy.net';
export const AUTOEMBED_DOMAIN = 'https://player.autoembed.cc';

export const EMBED_FRAME_SRC_DOMAINS = [
  ZXCSTREAM_DOMAIN,
  VIDSTUCK_DOMAIN,
  VIDIFY_DOMAIN,
  GEMMA_DOMAIN,
  VIDSRC_TO_DOMAIN,
  VIDNEST_DOMAIN,
  VIDFAST_DOMAIN,
  VIDEASY_DOMAIN,
  AUTOEMBED_DOMAIN,
  VIDSRC_EMBED_RU_DOMAIN,
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
] as const;

export const CSP_CONNECT_EXTRA_DOMAINS = [ZXCSTREAM_DOMAIN] as const;
