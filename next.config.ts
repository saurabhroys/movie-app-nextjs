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
        search: {
            stale: 60,
            revalidate: 60,
            expire: 600,
        },
        logo: {
            stale: 3600,
            revalidate: 86400,
            expire: 604800,
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
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), battery=(), interest-cohort=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://image.tmdb.org https://www.googletagmanager.com https://www.google-analytics.com",
                            "font-src 'self' data:",
                            "connect-src 'self' https://zxcstream.xyz https://www.googletagmanager.com https://www.google-analytics.com",
                            "media-src 'self' blob: data:",
                            "frame-src 'self' https://z.zxcstream.xyz https://player.vidify.top https://gemma416okl.com https://vidsrc.to https://embed.vidsrc.pk https://vidnest.fun https://vidfast.pro https://player.videasy.net https://player.autoembed.cc https://vidsrc-embed.ru https://www.youtube.com https://www.youtube-nocookie.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'self'",
                            'report-uri /api/csp-report',
                        ].join('; '),
                    },
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
