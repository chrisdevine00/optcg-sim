/**
 * M8 WP5: export and import. The round trip, and the hostile-input set: an export file is
 * untrusted, so the validator is checked against files that are not JSON, not ours, too big, too
 * deep, poisoned with prototype keys, full of unknown fields or wrong types, and against games that
 * look right but were forged.
 */
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IdbStore } from '../src/store/idb.ts';
import {
  bundleText,
  conflictsOf,
  exportEverything,
  exportGame,
  readImportFile,
} from '../src/store/data.ts';
import { liveness } from '../src/store/staleness.ts';
import { MemoryStore, type ExportBundle } from '../src/store/index.ts';
import {
  IMPORT_ERRORS,
  MAX_ACTIONS,
  MAX_IMPORT_BYTES,
  parseExport,
  validateExport,
} from '../src/store/validate.ts';
import { lookup, sessionRecord, storedGame, storedReview } from './store-support.ts';

const rec = sessionRecord(21);
const good = (): Record<string, unknown> =>
  JSON.parse(
    bundleText({
      schema: 'optcg-sim/export/1',
      exportedAt: 5,
      build: 'test',
      games: [storedGame('g1', 10, rec), storedGame('g2', 20, rec)],
      reviews: [storedReview('g1')],
      timing: {},
      progress: { lethal: [{ game: 1, turn: 3, furthest: 'tier2' }] },
    }),
  ) as Record<string, unknown>;
const text = (o: unknown) => JSON.stringify(o);
const games = (o: Record<string, unknown>) => o.games as Record<string, unknown>[];

describe('export and import round trip', () => {
  it('everything survives an export through text and an import into a fresh IndexedDB', async () => {
    const a = await IdbStore.open(new IDBFactory());
    await a.saveGame(storedGame('g1', 10, rec));
    await a.saveGame(storedGame('g2', 20, rec));
    await a.saveReview(storedReview('g1'));
    await a.progress.set('lethal', [{ game: 1, turn: 3, furthest: 'tier2' }]);
    const exported = await exportEverything(a);

    const parsed = parseExport(exported);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.skipped).toEqual([]);

    const b = await IdbStore.open(new IDBFactory());
    expect(await conflictsOf(b, parsed.bundle)).toEqual([]);
    expect(await b.importAll(parsed.bundle, 'replace')).toMatchObject({ added: 2 });
    expect(await b.getGame('g1')).toEqual(await a.getGame('g1'));
    expect(await b.getReview('g1')).toEqual(storedReview('g1'));
    expect(await b.progress.get('lethal')).toEqual([{ game: 1, turn: 3, furthest: 'tier2' }]);
    expect(await conflictsOf(b, parsed.bundle)).toEqual(['g2', 'g1']);
    // The imported game is live exactly as the original was: liveness is computed, never stored.
    expect(liveness((await b.getGame('g1'))!.record, lookup).live).toBe(true);
  });

  it('"Export this game" is one game and its review, in the same format', async () => {
    const a = new MemoryStore();
    await a.saveGame(storedGame('g1', 10, rec));
    await a.saveGame(storedGame('g2', 20, rec));
    await a.saveReview(storedReview('g2'));
    expect(await exportGame(a, 'nope')).toBeNull();
    const one = parseExport((await exportGame(a, 'g2'))!);
    expect(one.ok && one.bundle.games.map((g) => g.id)).toEqual(['g2']);
    expect(one.ok && one.bundle.reviews).toHaveLength(1);
  });

  it('a file from the app is not slow to read: validation of a 300-action game is quick', () => {
    const t0 = Date.now();
    expect(parseExport(text(good())).ok).toBe(true);
    expect(Date.now() - t0).toBeLessThan(5000);
  });
});

describe('hostile import files', () => {
  it('not JSON, not an object, not ours, from a newer version', () => {
    for (const t of ['', 'nope', '{', 'null', '[]', '42', '"x"', '{"schema":5}'])
      expect(parseExport(t)).toEqual({
        ok: false,
        error:
          t === '{"schema":5}' || ['null', '[]', '42', '"x"'].includes(t)
            ? IMPORT_ERRORS.notExport
            : IMPORT_ERRORS.notJson,
      });
    expect(parseExport(text({ schema: 'something/else' }))).toEqual({
      ok: false,
      error: IMPORT_ERRORS.notExport,
    });
    expect(parseExport(text({ schema: 'optcg-sim/export/2' }))).toEqual({
      ok: false,
      error: IMPORT_ERRORS.newer,
    });
  });

  it('over 50 MB is refused before anything is read', async () => {
    expect(parseExport('{}', MAX_IMPORT_BYTES + 1)).toEqual({
      ok: false,
      error: IMPORT_ERRORS.tooBig,
    });
    const huge = { size: MAX_IMPORT_BYTES + 1, text: () => Promise.reject(new Error('read')) };
    expect(await readImportFile(huge as unknown as Blob)).toEqual({
      ok: false,
      error: IMPORT_ERRORS.tooBig,
    });
  });

  it('prototype keys are dropped and nothing is polluted', () => {
    const o = good();
    const poison = JSON.parse(
      '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":2}},"ok":true}',
    ) as Record<string, unknown>;
    const g0 = games(o)[0]!;
    (g0.record as Record<string, unknown[]>).actions![0] = {
      ...((g0.record as Record<string, Rec[]>).actions![0] as Rec),
      ...poison,
    };
    o.timing = poison;
    o.progress = poison;
    (o.reviews as Rec[])[0]!.results = {
      ...((o.reviews as Rec[])[0]!.results as Rec),
      ...JSON.parse('{"__proto__":{"polluted":3}}'),
    };
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
    if (r.ok) {
      const action = r.bundle.games[0]!.record.actions[0] as unknown as Record<string, unknown>;
      expect(Object.keys(action)).not.toContain('constructor');
      expect(Object.getPrototypeOf(action)).toBe(Object.prototype);
      expect(Object.keys(r.bundle.reviews[0]!.results)).not.toContain('__proto__');
    }
  });

  it('unknown fields are dropped at every level', () => {
    const o = good();
    o.extra = 'x';
    const g = games(o)[0]!;
    g.surprise = 1;
    (g.meta as Rec).secret = 'y';
    const rv = (o.reviews as Rec[])[0]!;
    rv.extra = 1;
    const flag = ((Object.values(rv.results as Rec)[0] as Rec).flags as Rec[])[0]!;
    flag.heavy = { facts: new Array(10).fill('x') };
    (flag.explanation as Rec).hidden = 'z';
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const out = JSON.stringify(r.bundle);
    for (const w of ['surprise', 'secret', 'heavy', 'hidden', '"extra"'])
      expect(out).not.toContain(w);
    expect(Object.keys(r.bundle)).toEqual([
      'schema',
      'exportedAt',
      'build',
      'games',
      'reviews',
      'timing',
      'progress',
    ]);
  });

  it('wrong types, ranges and values leave out that game only, with a reason', () => {
    const o = good();
    const [a, b] = games(o);
    (a!.meta as Rec).result = 'cheated';
    (b!.meta as Rec).turns = -3;
    o.games = [
      a,
      b,
      { ...games(good())[0], id: '../../etc/passwd' },
      { ...games(good())[0], id: 'x'.repeat(500) },
      { ...games(good())[0], id: 'fine' },
      { ...games(good())[0], id: 'fine' },
      {
        ...games(good())[0],
        id: 'tier',
        meta: { ...(games(good())[0]!.meta as Rec), tier: 'god' },
      },
      'a string',
      null,
      {
        ...games(good())[0],
        id: 'inf',
        meta: { ...(games(good())[0]!.meta as Rec), turns: 123456789 },
      },
    ];
    const raw = text(o).replace('"turns":123456789', '"turns":1e999');
    expect(raw).toContain('1e999');
    const r = validateExport(JSON.parse(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.bundle.games.map((g) => g.id)).toEqual(['fine']);
    expect(r.skipped.length).toBeGreaterThanOrEqual(8);
    expect(r.skipped.join(' ')).toContain('appears twice');
  });

  it('a non-finite number (1e999) and nesting past the limit are refused', () => {
    const o = good();
    const deep: unknown = JSON.parse('['.repeat(200) + ']'.repeat(200));
    (games(o)[0]!.record as Rec).actions = [{ type: 'x', deep }];
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok && r.bundle.games.map((g) => g.id)).toEqual(['g2']);
    const raw = text(good()).replace('"exportedAt":5', '"exportedAt":1e999');
    expect(JSON.parse(raw).exportedAt).toBe(Infinity);
    const r2 = parseExport(raw);
    expect(r2.ok && r2.bundle.exportedAt).toBe(0);
  });

  it('huge lists are capped: too many actions drops that game, too many games keep the first 200', () => {
    const o = good();
    (games(o)[0]!.record as Rec).actions = new Array(MAX_ACTIONS + 1).fill({ type: 'endTurn' });
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok && r.bundle.games.map((g) => g.id)).toEqual(['g2']);

    const many = good();
    const one = games(good())[1]!;
    (one.record as Rec).snapshots = [];
    many.games = Array.from({ length: 230 }, (_, i) => ({ ...one, id: `g${i}` }));
    many.reviews = [];
    const m = validateExport(JSON.parse(text(many)));
    // A record with no snapshots is still well formed; liveness says whether it replays.
    expect(m.ok && m.bundle.games).toHaveLength(200);
    expect(m.ok && m.skipped.join(' ')).toContain('200');
  });

  it('a review for a game that is not in the file, or a damaged review, is left out; the games stay', () => {
    const o = good();
    o.reviews = [
      storedReview('ghost'),
      { ...storedReview('g1'), status: 'finished' },
      storedReview('g2'),
    ];
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok && r.bundle.reviews.map((x) => x.gameId)).toEqual(['g2']);
    expect(r.ok && r.bundle.games).toHaveLength(2);
  });

  it('text that looks like markup is kept as text; the app renders it only through React', () => {
    const o = good();
    (games(o)[0]!.meta as Rec).deckName = '<img src=x onerror=alert(1)>';
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok && r.bundle.games[0]!.meta.deckName).toBe('<img src=x onerror=alert(1)>');
    // No store, History or Settings code puts text into the page as HTML or evaluates it.
    const bad =
      /dangerouslySetInnerHTML|\.innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function\(|document\.write/;
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
      });
    const offenders = walk(new URL('../src', import.meta.url).pathname).filter((f) =>
      bad.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('a forged record imports as data but is never live: liveness replays it', () => {
    const forged = storedGame('forged', 1, {
      ...rec,
      versions: { ...rec.versions, engine: '0.0.1' },
      snapshots: rec.snapshots.map((s) => ({ ...s, hash: 'made-up' })),
    });
    const o = good();
    o.games = [JSON.parse(text(forged))];
    o.reviews = [];
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok && r.bundle.games).toHaveLength(1);
    if (!r.ok) return;
    expect(liveness(r.bundle.games[0]!.record, lookup)).toMatchObject({ live: false });
    // A review is untrusted too: "complete" in the file does not make a stale record live.
  });

  it('a hostile file never breaks a store: whatever validates can be imported', async () => {
    const o = good();
    (games(o)[0]!.meta as Rec).deckName = 'x'.repeat(100_000); // too long: that game goes
    const r = validateExport(JSON.parse(text(o)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = await IdbStore.open(new IDBFactory());
    await expect(s.importAll(r.bundle as ExportBundle, 'replace')).resolves.toMatchObject({
      added: 1,
    });
  });
});

type Rec = Record<string, unknown>;
