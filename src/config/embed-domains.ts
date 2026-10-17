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

/**
 * Players hidden from the server list (one ID per provider, matched against
 * the `PlayerOption.id` values in player-selector.tsx). Drop an ID here to
 * pull that provider from every player list; delete the entry to restore it.
 *
 * Blocked because providers on this list have a track record of ad
 * pop-unders and forced page redirects.
 */
export const BLOCKED_PROVIDER_IDS: readonly string[] = [
  'vidsrc-to',
  'vidsrc-to-tv-anime',
  'vidsrc-embed-ru',
  'autoembed-anime',
];

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

/**
 * Provider ids that tolerate an iframe `sandbox` with popups/top-navigation
 * blocked. Anything NOT in this list loads unsandboxed — some embed runtimes
 * (e.g. VidNest) detect the sandbox and refuse to play, so forcing the
 * attribute on them would break playback entirely.
 *
 * Keep every ad-heavy provider you can in here: the sandbox is the only
 * client-side defense that blocks their pop-unders and page redirects.
 */
export const SANDBOXED_PROVIDER_IDS: readonly string[] = [
  'vidify',
  'gemma',
  'vidsrc-to-tv-anime',
  'videasy-anime',
];
