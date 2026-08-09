import type { NextConfig } from 'next';

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

const config: NextConfig = {
    reactStrictMode: true,
    cacheComponents: true,
    cacheLife: {
        show: {
            stale: 300,
            revalidate: 1800,
            expire: 86400,
        },
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
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
    serverExternalPackages: ['@trpc/server'],
};

export default config;
