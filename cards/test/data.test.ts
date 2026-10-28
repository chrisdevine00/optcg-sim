import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card, Manifest, SetFile } from '../src/schema.ts';
import { blockOf, formatCardIds, standardLegality, type StandardFormat } from '../src/format.ts';
import { validateCard } from '../src/validate.ts';
import { loadScriptIndex } from '../scripts/diff.ts';
import { loadOverrides } from '../scripts/overrides.ts';
import { metaIds } from '../scripts/verify-meta.ts';

const root = new URL('../', import.meta.url);
const json = <T>(p: string) => JSON.parse(readFileSync(new URL(p, root), 'utf8')) as T;
const manifest = json<Manifest>('data/manifest.json');
const setFiles = readdirSync(new URL('data/sets/', root)).map((f) =>
  json<SetFile>(`data/sets/${f}`),
);
const cards = new Map<string, Card>(
  setFiles.flatMap((s) => s.cards.map((c) => [c.id, c] as const)),
);
const fmt = json<StandardFormat>('format/standard.json');

describe('generated card data', () => {
  it('every record passes schema validation', () => {
    const problems = [...cards.values()].flatMap(validateCard);
    expect(problems).toEqual([]);
    expect(cards.size).toBeGreaterThan(2500);
  });

  it('the manifest matches the set files', () => {
    expect(manifest.cardCount).toBe(cards.size);
    expect(manifest.sets.map((s) => s.code).sort()).toEqual(setFiles.map((s) => s.set.code).sort());
    for (const s of setFiles) {
      expect(s.cards.every((c) => c.set === s.set.code)).toBe(true);
      expect(s.set.cardCount).toBe(s.cards.length);
    }
    expect(manifest.newestSet).toBe('OP-17');
    expect(manifest.printingCount).toBe(
      [...cards.values()].reduce((n, c) => n + c.artworks.length, 0),
    );
  });

  it('has no type left unsplit and no junk text', () => {
    for (const c of cards.values()) {
      expect(c.effectText, c.id).not.toMatch(/^NULL$|disclaimer:|officially errata/i);
    }
  });

  it('commits text only: every artwork points at a remote image path, never a local file', () => {
    for (const c of cards.values()) {
      for (const a of c.artworks)
        if (a.imageUrls.full) expect(a.imageUrls.full).toMatch(/^[^/]+\.(jpe?g|png|webp)$/i);
    }
    const files = readdirSync(new URL('./', root), { recursive: true }) as string[];
    expect(files.filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f))).toEqual([]);
  });
});

describe('meta-list cards (PLAN M1 done criteria)', () => {
  const ids = metaIds(
    JSON.parse(
      readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
    ),
  );

  it('covers all 182 card IDs in docs/research/meta-lists.json', () => {
    expect(ids).toHaveLength(182);
    expect(ids.filter((id) => !cards.has(id))).toEqual([]);
  });

  it('every meta card is verified, with a cited source and printed keywords', () => {
    const notVerified = ids.filter((id) => !cards.get(id)!.verified);
    expect(notVerified).toEqual([]);
    const overrides = loadOverrides(new URL('overrides/', root).pathname);
    for (const id of ids) {
      const o = overrides.get(id)!;
      expect(o.verified, id).toBe(true);
      expect(o.keywords, id).toBeDefined();
      expect(
        o.sources.some((s) => s.url.startsWith('https://onepiece.limitlesstcg.com/cards/')),
      ).toBe(true);
    }
  });

  it('every scripted card is verified (none scripted yet)', () => {
    const scripted = loadScriptIndex(new URL('effects/', root).pathname);
    expect([...scripted].filter((id) => !cards.get(id)?.verified)).toEqual([]);
  });
});

describe('format/standard.json', () => {
  it('every card ID it names resolves to a real card', () => {
    const ids = formatCardIds(fmt);
    expect(ids.length).toBeGreaterThan(60);
    expect(ids.filter((id) => !cards.has(id))).toEqual([]);
  });

  it('every entry cites a source and a check date', () => {
    const sources = [
      fmt.regulation.source,
      ...Object.values(fmt.blocksByProduct).map((b) => b.source),
      ...Object.values(fmt.exceptions).map((e) => e.source),
      ...fmt.banned.map((b) => b.source),
      ...fmt.bannedPairs.map((b) => b.source),
    ];
    for (const s of sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // rulings.md RL-37 engine-test list, run against the real file.
  it('computes Standard legality per card number (RL-37)', () => {
    const legal = (id: string) => standardLegality(id, blockOf(id, fmt), fmt).status;
    expect(legal('OP01-016')).toBe('legal'); // SPR list and reprint-updated list
    expect(legal('OP03-008')).toBe('legal'); // fixed block 4
    expect(legal('OP01-001')).toBe('rotated'); // block 1, on no list
    expect(legal('OP15-096')).toBe('legal'); // blank block on the site; OP-15 is block 4
    expect(legal('EB04-061')).toBe('legal'); // block updated by reprint
    expect(legal('OP14-020')).toBe('banned');
    expect(standardLegality('OP11-040', 4, fmt).bannedWith).toEqual(['OP11-067', 'OP08-069']);
    expect(blockOf('OP17-118', fmt)).toBe('X');
    expect(blockOf('ST01-011', fmt)).toBe(4);
    expect(blockOf('P-001', fmt)).toBeNull();
  });

  it('the generated cards carry the computed block and legality', () => {
    expect(cards.get('OP16-064')!.block).toBe(5);
    expect(cards.get('OP14-020')!.legality.standard.status).toBe('banned');
    expect(cards.get('P-088')!.block).toBe(3);
    expect(cards.get('OP01-001')!.legality.standard.status).toBe('rotated');
  });
});
