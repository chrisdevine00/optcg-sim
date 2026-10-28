import { describe, expect, it } from 'vitest';
import type { Card } from '../src/schema.ts';
import { diffSnapshots, formatDiff } from '../scripts/diff.ts';

const card = (id: string, over: Partial<Card> = {}): Card => ({
  id,
  name: `Card ${id}`,
  category: 'Character',
  colors: ['Red'],
  cost: 2,
  power: 3000,
  counter: 1000,
  life: null,
  attributes: ['Slash'],
  types: ['Straw Hat Crew'],
  rarity: 'C',
  set: 'OP-17',
  block: 5,
  effectText: '[On Play] Draw 1 card.',
  triggerText: null,
  keywords: [],
  verified: false,
  verifiedBy: [],
  textFixes: [],
  artworks: [
    {
      artworkId: id,
      imageUrls: { full: `${id}.jpg` },
      source: 'optcgapi',
      product: 'OP-17',
      rarity: 'C',
    },
  ],
  legality: { standard: { status: 'legal' }, extra: { status: 'legal' } },
  sourceUrl: `https://optcgapi.com/api/sets/card/${id}/`,
  fetchedAt: '2026-10-28T13:47:17.000Z',
  ...over,
});
const snap = (...cards: Card[]) => new Map(cards.map((c) => [c.id, c]));

describe('diff report against a doctored snapshot', () => {
  // The "previous snapshot" is doctored: one card removed, one card's text and power altered.
  const next = snap(card('OP17-001'), card('OP17-002'), card('OP17-003'));
  const prev = snap(
    card('OP17-001'),
    card('OP17-002', { effectText: '[On Play] Draw 2 cards.', power: 4000 }),
    card('OP17-099'),
  );

  it('lists new, removed, errata and stat changes', () => {
    const r = diffSnapshots(prev, next, new Set());
    expect(r.added).toEqual(['OP17-003']);
    expect(r.removed).toEqual(['OP17-099']);
    expect(r.textChanged).toEqual([
      {
        id: 'OP17-002',
        field: 'effectText',
        before: '[On Play] Draw 2 cards.',
        after: '[On Play] Draw 1 card.',
      },
    ]);
    expect(r.statsChanged).toEqual([{ id: 'OP17-002', fields: ['power'] }]);
    expect(r.failures).toEqual([]);
    const text = formatDiff(r);
    expect(text).toContain('New cards: 1 (OP17-003)');
    expect(text).toContain('Changed text (errata): 1');
    expect(text).toContain('+ [On Play] Draw 1 card.');
  });

  it('fails when the text of a scripted card changes, or a scripted card disappears', () => {
    const r = diffSnapshots(prev, next, new Set(['OP17-002', 'OP17-099']));
    expect(r.failures).toEqual([
      'OP17-002: effectText changed on a scripted card; re-verify its script',
      'OP17-099: removed upstream but has a script',
    ]);
    expect(formatDiff(r)).toContain('FAIL OP17-002');
  });

  it('passes with the real (empty) script index', () => {
    expect(diffSnapshots(prev, next, new Set()).failures).toEqual([]);
  });

  it('treats a first run as all new', () => {
    expect(diffSnapshots(null, next, new Set()).added).toHaveLength(3);
  });
});
