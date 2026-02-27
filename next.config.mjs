/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
const { env } = await import('./src/env.mjs');

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  cacheComponents: true,
  cacheLife: {
    show: {
      stale: 300,
      revalidate: 1800,
      expire: 86400,
    },
  },

  /**
   * i18n configuration is unsupported in App Router.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   * @see https://nextjs.org/docs/app/building-your-application/routing/internationalization
   */
  // i18n: {
  //   locales: ['en'],
  //   defaultLocale: 'en',
  // },
  images: {
    unoptimized: !env.NEXT_PUBLIC_IMAGE_DOMAIN,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: env.NEXT_PUBLIC_IMAGE_DOMAIN ?? 'image.tmdb.org',
        pathname: '/**',
      },
    ],
    imageSizes: [48, 64, 96],
    deviceSizes: [128, 256, 512, 1200],
  },
  serverExternalPackages: ['@trpc/server'],
};

export default config;
