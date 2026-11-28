/**
 * M10 WP6: the one source for what the About page says about whose work this app stands on
 * (PROMPT: Legal posture). `docs/legal/CREDITS.md` is generated from this file by
 * `scripts/licences.ts --credits`, and a test compares them, so the page and the document cannot
 * drift. Plain data: no imports from the app, so a script can load it.
 */
import { IMAGE_SOURCES } from '../art/sources.ts';

/** The unofficial notice: the footer, the About page and the README say exactly this (a test compares them). */
export const NOTICE =
  'OPTCG Sim is an unofficial, non-commercial fan tool, not affiliated with or endorsed by Bandai, Shueisha, or Toei Animation. One Piece and all card names, text, and art belong to their respective owners.';

/** Where the owner is to be reached about a problem; the README names the same place. */
export const REPORT_URL = 'https://github.com/chrisdevine00/optcg-sim/issues';
/** The deployed address (README and the deploy check use it). */
export const SITE_URL = 'https://chrisdevine00.github.io/optcg-sim/';

/** Until the owner chooses (the lead's note: no LICENSE file, no licence field). */
export const LICENCE_LINE = 'Licence: to be chosen by the owner';

export interface Credit {
  id: string;
  name: string;
  url: string;
  /** What this app takes from it. */
  role: string;
  /** The source's terms as this project recorded them, in one sentence. */
  terms: string;
  /** Hosts this credit covers (the coverage test reads them). */
  hosts: string[];
}

const optcgapiAbout = IMAGE_SOURCES.optcgapi.about;
const arjunkaiAbout = IMAGE_SOURCES.arjunkai.about;

export const CREDITS: readonly Credit[] = [
  {
    id: 'optcgapi',
    name: 'optcgapi.com',
    url: optcgapiAbout,
    role: 'Card data (names, costs, powers, effect text) and the card images, which your browser loads from optcgapi.com while you play. Every image is its scan with the SAMPLE watermark. If an image does not load, the app tries the next source, then draws the card as text.',
    terms:
      'It describes its data as open for anyone to use. Images are shown from its servers and never copied into this project.',
    hosts: [new URL(IMAGE_SOURCES.optcgapi.base).host],
  },
  {
    id: 'arjunkai',
    name: 'arjunkai optcg-api',
    url: arjunkaiAbout,
    role: 'A second image source in the fallback order. It is switched off, so nothing is requested from it.',
    terms: 'It stays off until its maintainer approves third-party use.',
    hosts: [new URL(IMAGE_SOURCES.arjunkai.base).host],
  },
  {
    id: 'limitless',
    name: 'Limitless',
    url: 'https://onepiece.limitlesstcg.com',
    role: 'Tournament decklists and play rates from the Limitless Play public API, and card text from its card pages: the data of OP-18 until optcgapi.com has the set (those cards show as text, with no image), and a cross-check for the rest.',
    terms:
      'Its developer documentation asks for no key for public reads and sets no attribution rule; it is credited here anyway, and it is read slowly and cached.',
    hosts: ['onepiece.limitlesstcg.com', 'play.limitlesstcg.com', 'docs.limitlesstcg.com'],
  },
  {
    id: 'opmetagame',
    name: 'opmetagame',
    url: 'https://opmetagame.com',
    role: 'The tier labels in the deck guides, cited by name and date.',
    terms: 'Its robots.txt allows reading; only the labels are used, never its pages.',
    hosts: ['opmetagame.com'],
  },
  {
    id: 'shonen',
    name: 'Shonen TCG',
    url: 'https://www.shonentcg.com',
    role: 'Deck guides and strategy articles, cited by title and date in each guide and lesson. Our guides are paraphrase and our own examples, not copies.',
    terms: 'Its robots.txt allows reading, including by AI agents; no article text is reproduced.',
    hosts: ['www.shonentcg.com', 'shonentcg.com'],
  },
  {
    id: 'bounty',
    name: 'Bounty TCG',
    url: 'https://www.bountytcg.app',
    role: 'Strategy articles on turn order and attacking, cited by title and date where a lesson uses them.',
    terms: 'Its robots.txt allows reading, including by AI agents; no article text is reproduced.',
    hosts: ['www.bountytcg.app', 'bountytcg.app'],
  },
  {
    id: 'others',
    name: 'Haki TCG and TCGplayer',
    url: 'https://hakitcg.com',
    role: 'A battle-maths example and the tournament write-ups cited in the meta notes, named where they are used.',
    terms:
      'Haki TCG allows reading. TCGplayer was not fetched by this project; its articles are cited by link and never reproduced.',
    hosts: ['hakitcg.com', 'www.tcgplayer.com', 'tcgplayer.com'],
  },
  {
    id: 'rules',
    name: 'The One Piece Card Game Comprehensive Rules',
    url: 'https://en.onepiece-cardgame.com/rules/',
    role: 'The rules the engine implements, version 1.2.1. The rule explanations here are our paraphrase; the official text is Bandai’s.',
    terms:
      'The official site’s terms do not allow bulk reproduction of its text, so none is copied; rules are cited by number.',
    hosts: ['en.onepiece-cardgame.com'],
  },
  {
    id: 'inter',
    name: 'Inter',
    url: 'https://github.com/rsms/inter',
    role: 'The text typeface, bundled with the app.',
    terms:
      'Copyright 2016 The Inter Project Authors. SIL Open Font License 1.1; the full text is in the third-party licences file.',
    hosts: [],
  },
  {
    id: 'fraunces',
    name: 'Fraunces',
    url: 'https://github.com/undercasetype/Fraunces',
    role: 'The heading typeface, bundled with the app.',
    terms:
      'Copyright 2020 The Fraunces Project Authors. SIL Open Font License 1.1; the full text is in the third-party licences file.',
    hosts: [],
  },
];

/** Hosts of our own that the credits need not cover (the repository this app is built from). */
export const OWN_HOSTS: readonly string[] = ['github.com'];

/** The privacy statement, in plain words (the plan's wording; the privacy e2e is the proof). */
export const PRIVACY: readonly string[] = [
  'There is no account, no server of ours, no analytics and no cookies we set.',
  'Your games, decks, reviews and progress live in this browser’s IndexedDB and localStorage. They leave it only when you use Export.',
  'After the app has loaded, the only network requests are for card images, from the hosts named under Credits, and for the app’s own files and its version check, from GitHub Pages, where the app is hosted. Their operators see your address, as any website would. The page sends no referrer, so an image host is not told which page you were on.',
  'An image address names the card, so the image host can tell which cards you look at, the cards in your decks included.',
  'The service worker keeps the app and the images you have seen so it works offline.',
];

/**
 * What the accessibility claim is, word for word (M10-R2). The CHANGELOG and the README say the same
 * sentence (a test compares them); it changes only when the manual passes are done.
 */
export const ACCESSIBILITY_CLAIM =
  'Tested against WCAG 2.2 AA with automated checks on every route; manual screen-reader passes pending.';

/** The limits of that claim, as the audit found them (docs/design/a11y-passes/m10-automated.md). */
export const ACCESSIBILITY_LIMITS: readonly string[] = [
  'Text drawn over card art: its contrast is unverified, because the automated audit blocks card art.',
  'With text spacing forced larger (WCAG 1.4.12), the main button on two board screens at 1280×720 wraps to three lines and its border is cut by 4 pixels; its label stays whole.',
  'NVDA was scripted for the earlier milestones; the About, Page not found, update and offline screens have not been heard. VoiceOver has not been run. Both are pending.',
];

/** The credits as markdown: `docs/legal/CREDITS.md` (generated by `scripts/licences.ts --credits`). */
export function creditsMarkdown(): string {
  const lines = [
    '# Credits',
    '',
    '<!-- Generated by `npx tsx scripts/licences.ts --credits` from app/src/about/credits.ts. Do not edit by hand. -->',
    '',
    NOTICE,
    '',
    LICENCE_LINE + '.',
    '',
  ];
  for (const c of CREDITS) {
    lines.push(`## ${c.name}`, '', c.url, '', c.role, '', `Terms: ${c.terms}`, '');
  }
  lines.push(
    '## Third-party software',
    '',
    'The licence of every package shipped in the app is in `third-party.txt`, generated at build by `scripts/licences.ts`.',
    '',
  );
  return lines.join('\n');
}
