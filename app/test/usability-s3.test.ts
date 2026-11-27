/**
 * M10 WP9: the owner's session 3 kit (docs/design/usability/S3-kit.md) says what the app does.
 * - Every address the kit tells them to open resolves to a route of the app (the matcher App.tsx uses
 *   for the learning layer plus the top-level paths App.tsx names).
 * - `S3-list.txt` goes through the real importer's parser with no problem line, is 50 cards, is
 *   Standard-legal, and its header names its source and date; the kit quotes the importer's own report.
 * - `S3-seed.json` passes the export validator, holds drill sessions and lesson marks and NO games or
 *   reviews, and importing it twice through the real import path changes nothing; the recommendation
 *   the kit quotes is what `recommend` says for it.
 * - The plan's minutes are contiguous and add up to 90; the kit's two SUS examples match the scorer and
 *   two hand-computed sheets.
 * Nothing here is `any-hand` material (no judge, no hidden information). Reverts, each failing a test:
 * change the importer grammar (the list test); rename `/about` or `/progress` (the address test); drop
 * a card from the list or make `usable` skip the legality check (the list and the pick tests); add a
 * game to the seed (the seed test); change the plan's minutes or `susScore`'s weights (the plan, SUS).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDeckText, type Card } from '@optcg/cards';
import { deckIssues } from '@optcg/engine';
import { MemoryStore } from '../src/store/index.ts';
import { PROGRESS_KEY, sanitizeProgress, validateExport } from '../src/store/validate.ts';
import { emptyProgress, importWithProgress, readable } from '../src/progress/store.ts';
import { mergeProgress } from '../src/progress/merge.ts';
import { recommend } from '../src/progress/recommend.ts';
import { lessonInfo } from '../src/progress/derive.ts';
import { m9Route } from '../src/routes/m9.ts';
import {
  formatList,
  makeSeed,
  pickList,
  susScore,
  usable,
  type MetaArchetype,
} from '../../scripts/usability-s3.ts';
import { cardMap, lookup } from './support.ts';

const read = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
const KIT = read('../../docs/design/usability/S3-kit.md');
const LIST = read('../../docs/design/usability/S3-list.txt');
const SEED_TEXT = read('../../docs/design/usability/S3-seed.json');
const APP = read('../src/App.tsx');
const CURRICULUM = read('../../docs/content/curriculum.md');

const cards = cardMap();
const lookupCard = (id: string): Card | undefined => cards.get(id);

describe('every address in the kit is a route', () => {
  /** Paths App.tsx names itself: `path === '/about'`, `path.startsWith('/decks/')`, `path === '/'`. */
  const named = new Set(
    [...APP.matchAll(/path(?: ===|\.startsWith\() ?'(\/[a-z/]*)'/g)].map((m) => m[1]!),
  );
  const resolves = (path: string): boolean => {
    const clean = '/' + path.split(/[?#]/)[0]!.replace(/^\/+|\/+$/g, '');
    if (clean === '/') return named.has('/');
    return m9Route(clean) !== null || named.has(clean);
  };
  // The kit's own explanation writes `<base>path` as a placeholder: not an address.
  const addresses = [...KIT.matchAll(/<base>([A-Za-z0-9/._-]*(?:\?[^\s`)<>"']*)?)/g)]
    .map((m) => m[1]!)
    .filter((a) => a !== 'path');

  it('finds the addresses the cards name', () => {
    const paths = new Set(addresses.map((a) => a.split('?')[0]));
    for (const p of [
      '',
      'about',
      'decks',
      'meta',
      'drills',
      'progress',
      'settings',
      'play',
      'reviews',
    ])
      expect(paths, `the kit names <base>${p}`).toContain(p);
    expect(paths).toContain('meta/OP17-058');
  });
  it('every one resolves to a page', () => {
    for (const a of addresses) expect(resolves(a), `<base>${a}`).toBe(true);
  });
  it('the matcher does reject a path that is not a page (the test can fail)', () => {
    expect(resolves('no-such-page')).toBe(false);
  });
  it('the deployed address is the one the repository publishes to', () => {
    expect(KIT).toContain('https://chrisdevine00.github.io/optcg-sim/');
    expect(read('../vite.config.ts')).toMatch(/\/optcg-sim\//);
  });
});

describe('S3-list.txt', () => {
  const parsed = parseDeckText(LIST, lookupCard);

  it('imports with no problem line, 50 cards and a Leader, through the real parser', () => {
    expect(parsed.lines.filter((l) => l.status !== 'ok' && l.status !== 'leader')).toEqual([]);
    expect(parsed.leader).toBe('OP17-039');
    expect(parsed.main).toHaveLength(50);
    // The kit quotes the importer's own report: "N lines read · N OK · 0 problems" and "Import 50 cards".
    expect(KIT).toContain(
      `${parsed.lines.length} lines read · ${parsed.lines.length} OK · 0 problems`,
    );
    expect(KIT).toContain(`Import ${parsed.main.length} cards`);
  });
  it('is Standard-legal', () => {
    expect(deckIssues({ leader: parsed.leader!, main: parsed.main }, lookup, 'standard')).toEqual(
      [],
    );
  });
  it('names its source and date in a header the importer ignores', () => {
    const head = LIST.split('\n').filter((l) => l.startsWith('#'));
    expect(head.length).toBeGreaterThanOrEqual(3);
    expect(head.join('\n')).toMatch(/Source: .+ at .+ on \d{4}-\d{2}-\d{2}\./);
    expect(head.join('\n')).toMatch(/https:\/\//);
    expect(
      LIST.split('\n').filter((l) => l.startsWith('#') && parsed.lines.some((p) => p.text === l)),
    ).toEqual([]);
  });
  it('is what the generator makes from the live meta file, and the source is in that file', () => {
    const meta = JSON.parse(read('../../docs/research/meta-lists.json')) as {
      asOf: string;
      archetypes: (MetaArchetype & { lists: { url: string; date: string }[] })[];
    };
    const urls = new Set(meta.archetypes.flatMap((a) => a.lists.map((l) => l.url)));
    const url = /^# (https:\/\/\S+)$/m.exec(LIST)![1]!;
    expect(urls.has(url), 'the list cites a list in docs/research/meta-lists.json').toBe(true);
    // Re-making it from its own source gives the same text (pure, no clock): the committed file is the
    // generator's output, not hand-typed.
    const a = meta.archetypes.find((x) => x.lists.some((l) => l.url === url))!;
    const list = a.lists.find((l) => l.url === url)!;
    expect(formatList({ archetype: a, list }, meta.asOf)).toBe(LIST);
  });
});

describe('pickList', () => {
  const real = JSON.parse(read('../../docs/research/meta-lists.json')) as {
    archetypes: MetaArchetype[];
  };
  const good = real.archetypes[0]!;

  it('takes the first list of the first archetype that is legal and automated', () => {
    expect(usable(good.lists[0]!, lookup)).toBe(true);
    const p = pickList(real.archetypes, lookup)!;
    expect(p.list).toBe(real.archetypes.find((a) => a.lists[0] === p.list)!.lists[0]);
  });
  const fiveCopies = (main: { id: string; count: number }[]) => {
    const one = main.find((c) => c.count === 4)!;
    const other = main.find((c) => c !== one && c.count === 3)!;
    return main.map((c) => (c === one ? { ...c, count: 5 } : c === other ? { ...c, count: 2 } : c));
  };
  it('skips a first list that is not 50 cards, or not legal, or not automated', () => {
    const short: MetaArchetype = {
      ...good,
      id: 'short',
      lists: [{ ...good.lists[0]!, main: good.lists[0]!.main.slice(1) }],
    };
    const tooMany: MetaArchetype = {
      ...good,
      id: 'five',
      // Still 50 cards, but five copies of one card (the limit is four): only the legality check rejects it.
      lists: [{ ...good.lists[0]!, main: fiveCopies(good.lists[0]!.main) }],
    };
    const p = pickList([short, tooMany, good], lookup)!;
    expect(p.archetype.id).toBe(good.id);
    // Nothing is scripted: every card with effect text is "not automated", so the list is skipped.
    expect(usable(good.lists[0]!, lookup, new Set())).toBe(false);
    expect(pickList([good], lookup, new Set())).toBeNull();
  });
});

describe('S3-seed.json', () => {
  const seed = JSON.parse(SEED_TEXT) as unknown;
  const parsed = validateExport(seed);

  it('passes the import validator with nothing left out', () => {
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.skipped).toEqual([]);
    expect(parsed.bundle.schema).toBe('optcg-sim/export/1');
  });
  it('holds three drill sessions and lesson marks, and no games, reviews or timing', () => {
    if (!parsed.ok) throw new Error('not valid');
    const b = parsed.bundle;
    expect(b.games).toEqual([]);
    expect(b.reviews).toEqual([]);
    expect(b.timing).toEqual({});
    const p = readable(b.progress[PROGRESS_KEY]);
    expect(p.sessions.map((s) => s.drill).sort()).toEqual(['counter', 'don', 'lethal']);
    expect(Object.keys(p.lessons).sort()).toEqual(['L09', 'L10', 'L11']);
    // Nothing the validator would have dropped: the stored value is its own sanitised form.
    expect(sanitizeProgress(JSON.parse(SEED_TEXT).progress.v1)).toEqual(p);
  });
  it('is what the generator makes (the lesson ids come from the curriculum)', () => {
    expect(JSON.stringify(makeSeed(CURRICULUM), null, 2) + '\n').toBe(SEED_TEXT);
  });
  it('merges idempotently: importing it twice through the real import path changes nothing', async () => {
    if (!parsed.ok) throw new Error('not valid');
    const store = new MemoryStore();
    await importWithProgress(store, parsed.bundle, 'replace');
    const once = structuredClone(await store.exportAll('x')).progress;
    await importWithProgress(store, parsed.bundle, 'replace');
    const twice = (await store.exportAll('x')).progress;
    expect(twice).toEqual(once);
    expect(readable(once[PROGRESS_KEY])).toEqual(readable(parsed.bundle.progress[PROGRESS_KEY]));
    const p = readable(parsed.bundle.progress[PROGRESS_KEY]);
    expect(mergeProgress(p, p)).toEqual(p);
    expect(mergeProgress(emptyProgress(), p)).toEqual(p);
    expect((await store.listGames()).length).toBe(0);
  });
  it('makes the recommendation the kit quotes, and the drill states it says', () => {
    if (!parsed.ok) throw new Error('not valid');
    const progress = readable(parsed.bundle.progress[PROGRESS_KEY]);
    const input = { games: [], reviews: new Map(), progress, credit: null };
    const r = recommend(input, Date.UTC(2026, 10, 27));
    expect(r.kind).toBe('course');
    expect(r.reviewed).toBe(0);
    expect(r.reason).toBe('Not enough games yet: next in the course is L01.');
    expect(KIT).toContain(`Work on: ${r.title}`);
    expect(KIT).toContain(`"${r.reason}"`);
    expect(lessonInfo('L10', input).status).toBe('passed');
    expect(lessonInfo('L09', input).status).toBe('passed');
    expect(lessonInfo('L15', input).status).toBe('in-progress');
    expect(KIT).toContain('8 of 10, 7 of 10 and 6 of 10');
  });
});

describe('the plan', () => {
  const rows = [...KIT.matchAll(/^\| (\d+) to (\d+) \| (.+) \|$/gm)].map((m) => ({
    from: Number(m[1]),
    to: Number(m[2]),
    what: m[3]!,
  }));

  it('is contiguous from 0 and adds up to 90 minutes', () => {
    expect(rows.length).toBe(10);
    expect(rows[0]!.from).toBe(0);
    rows.forEach((r, i) => {
      if (i > 0) expect(r.from, `row ${i + 1} starts where the last ends`).toBe(rows[i - 1]!.to);
      expect(r.to).toBeGreaterThan(r.from);
    });
    expect(rows.reduce((n, r) => n + (r.to - r.from), 0)).toBe(90);
    expect(rows.at(-1)!.to).toBe(90);
    expect(KIT).toMatch(/\*\*Time:\*\* 90 minutes/);
  });
  it("gives the usability plan's windows for each task", () => {
    const text = (s: string) => rows.find((r) => r.what.includes(s))!;
    expect([text('Task 3.1').from, text('Task 3.1').to]).toEqual([5, 12]);
    expect([text('Task 3.2').from, text('Task 3.2').to]).toEqual([12, 22]);
    expect([text('Task 3.3').from, text('Task 3.3').to]).toEqual([22, 34]);
    expect([text('Task 3.4').from, text('Task 3.4').to]).toEqual([34, 50]);
    expect([text('Task 3.5').from, text('Task 3.5').to]).toEqual([50, 58]);
    expect([text('Task 3.6').from, text('Task 3.6').to]).toEqual([58, 66]);
    expect([text('Task 3.7').from, text('Task 3.7').to]).toEqual([66, 82]);
    expect([text('Task 3.8').from, text('Task 3.8').to]).toEqual([82, 88]);
  });
  it('words the eight task cards as usability-plan §5.4 does', () => {
    const plan = read('../../docs/design/usability-plan.md');
    for (const q of KIT.matchAll(/^> "(.+)"$/gm)) {
      const words = q[1]!.replace(/\.$/, '');
      if (words.startsWith('Continue the game')) continue; // 3.8's card is the steps; the plan quotes the whole task
      expect(plan, words).toContain(words);
    }
  });
});

describe('SUS', () => {
  it('matches the sheets in the kit and two computed by hand', () => {
    // Hand: A odd 4 4 5 4 4 -> 3+3+4+3+3 = 16; even 2 2 1 2 3 -> 3+3+4+3+2 = 15; 31 x 2.5 = 77.5.
    expect(susScore([4, 2, 4, 2, 5, 1, 4, 2, 4, 3])).toBe(77.5);
    // Hand: B odd 2 3 2 3 4 -> 1+2+1+2+3 = 9; even 4 3 4 3 2 -> 1+2+1+2+3 = 9; 18 x 2.5 = 45.
    expect(susScore([2, 4, 3, 3, 2, 4, 3, 3, 4, 2])).toBe(45);
    const sheets = [...KIT.matchAll(/^\| ([AB]) \| ([1-5](?: [1-5]){9}) \| ([\d.]+) \|$/gm)];
    expect(sheets.map((m) => m[1])).toEqual(['A', 'B']);
    for (const m of sheets)
      expect(susScore(m[2]!.split(' ').map(Number)), `sheet ${m[1]}`).toBe(Number(m[3]));
  });
  it('is 0 to 100 at the extremes and 50 for all neutral', () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
    expect(susScore(Array<number>(10).fill(3))).toBe(50);
  });
  it('refuses a sheet that is not ten answers from 1 to 5', () => {
    expect(() => susScore([3, 3, 3])).toThrow();
    expect(() => susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 6])).toThrow();
    expect(() => susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 2.5])).toThrow();
  });
  it('the kit lists ten statements and says how to score them', () => {
    expect([...KIT.matchAll(/^\| (\d+) \| I [^|]+\| \| \| \| \| \|$/gm)]).toHaveLength(10);
    expect(KIT).toContain('minus 1');
    expect(KIT).toContain('multiply by 2.5');
  });
});
