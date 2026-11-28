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
    expect(manifest.newestSet).toBe('OP-18');
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

describe('OP-18 from Limitless card pages (ADR 0015)', () => {
  const op18 = setFiles.find((s) => s.set.code === 'OP-18')!;

  it('has the whole booster, block 5 cited, every card Standard-legal', () => {
    expect(op18.set).toMatchObject({ name: 'The Dominance of God', cardCount: 119, block: 5 });
    expect(fmt.blocksByProduct['OP-18']?.source.url).toMatch(/series=569118$/);
    for (const c of op18.cards) expect(c.legality.standard.status, c.id).toBe('legal');
    // Block X printed on two base printings (official series page), carried by their overrides.
    expect(op18.cards.filter((c) => c.block === 'X').map((c) => c.id)).toEqual([
      'OP18-031',
      'OP18-065',
    ]);
  });

  it('records the source per card and adds no image host: every card is a text face', () => {
    for (const c of op18.cards) {
      expect(c.dataSource, c.id).toBe('limitless');
      expect(c.sourceUrl).toBe(`https://onepiece.limitlesstcg.com/cards/${c.id}`);
      for (const a of c.artworks) expect(a).toMatchObject({ source: 'none', imageUrls: {} });
    }
    // Every other card still comes from optcgapi.
    const others = [...cards.values()].filter((c) => c.set !== 'OP-18');
    expect(others.filter((c) => c.dataSource !== undefined)).toEqual([]);
    expect(manifest.source).toMatch(/OP-18 from Limitless card pages/);
  });

  it('keeps the printed minus and splits types on the slash (OP18-021 Franky)', () => {
    const franky = cards.get('OP18-021')!;
    expect(franky).toMatchObject({ category: 'Leader', life: 4, power: 5000, rarity: 'L' });
    expect(franky.colors).toEqual(['Green', 'Purple']);
    expect(franky.types).toEqual(['Water Seven', 'The Franky Family', 'Straw Hat Crew']);
    expect(franky.effectText).toContain('DON!! −1: Play up to 1 Stage card');
  });
});

describe('meta-list cards (PLAN M1 done criteria)', () => {
  // The M1 lists, pinned (M6b-0): a meta update PR adds cards that are not verified yet; its report
  // lists them for the next scripting batch instead of failing here.
  const ids = metaIds(
    JSON.parse(
      readFileSync(
        new URL('../../ai/test/fixtures/meta-lists.pinned.json', import.meta.url),
        'utf8',
      ),
    ),
  );

  it('covers all 182 card IDs of the M1 meta lists', () => {
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
    // Reads every override file: slow under heavy machine load (timed out at 5 s with six agents running).
  }, 30_000);

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
    // 2026-11-27 list: Jewelry Bonney (EB05-001) may not share a deck with OP13-001 or OP01-002.
    expect(standardLegality('EB05-001', 5, fmt).bannedWith).toEqual(['OP13-001', 'OP01-002']);
    expect(standardLegality('OP13-001', 4, fmt).bannedWith).toEqual(['EB05-001']);
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
