import type { Config } from 'prettier';
import type { PluginOptions } from 'prettier-plugin-tailwindcss';

/** @type {Config & PluginOptions} */
const config: Config & PluginOptions = {
    plugins: ['prettier-plugin-tailwindcss'],
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    bracketSameLine: true,
};

export default config;
