/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
const { env } = await import('./src/env.mjs');

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  expireTime: 86400,
  // devIndicators: false,

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
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@trpc/server'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default config;
