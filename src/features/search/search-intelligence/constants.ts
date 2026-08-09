/**
 * Intelligent Search Utilities — data constants
 * Keyword lists used by the adult content filter (blocks pornographic content,
 * keeps legitimate 18+ content).
 */

/**
 * List of explicit/pornographic keywords that indicate adult content to block
 * These are terms commonly found in pornographic titles/overviews
 * NOTE: We use specific terms to avoid blocking legitimate R-rated/18+ content
 */
export const PORNOGRAPHIC_KEYWORDS = [
  // Explicit content identifiers
  'xxx',
  'porn',
  'porno',
  'pornography',
  'pornographic',
  'hardcore',
  'hard-core',
  'hardcore porn',
  'adult film',
  'adult movie',
  'adult video',
  'adult content',
  'adult entertainment',
  'xxx movie',
  'xxx film',
  'xxx video',
  'xxx rated',
  'x-rated',
  'x rated',
  'nc-17',
  'nc17',
  // Explicit sexual content terms
  'sex tape',
  'sex film',
  'sex movie',
  'sex video',
  'sex content',
  'sexual content',
  'explicit sex',
  'explicit sexual',
  'explicit content',
  'full nudity',
  'graphic sex',
  'hardcore sex',
  // Adult industry terms
  'adult industry',
  'adult production',
  'adult studio',
  'adult performer',
  'escort service',
  'escort film',
  // Explicit genre terms
  'hentai',
  'ecchi',
  'yuri',
  'yaoi',
  'bdsm film',
  'bdsm movie',
  'fetish film',
  'fetish movie',
  'gangbang',
  'orgy',
  'threesome film',
  'threesome movie',
  // Other explicit indicators
  'uncensored sex',
  'uncensored film',
  'softcore porn',
  'softcore film',
  'erotica film',
  'erotic film',
  'erotic movie',
  'sexploitation',
  'sexploitation film',
];

/**
 * List of legitimate show/movie titles that contain "sex" but are not pornographic
 * These are popular mainstream shows that should not be blocked
 */
export const LEGITIMATE_SEX_TITLES = [
  'sex education',
  'sex and the city',
  'sex drive',
  'sex, lies, and videotape',
  'sex and drugs and rock and roll',
  'sex ed',
];
