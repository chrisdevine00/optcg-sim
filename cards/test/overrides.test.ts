import { describe, expect, it } from 'vitest';
import type { Card } from '../src/schema.ts';
import { applyOverride, type Override } from '../scripts/overrides.ts';

const base = (): Card => ({
  id: 'OP17-087',
  name: 'Nico Robin',
  category: 'Character',
  colors: ['Black'],
  cost: 2,
  power: 2000,
  counter: 1000,
  life: null,
  attributes: ['Strike'],
  types: ['Straw Hat Crew', 'Elbaph'],
  rarity: 'R',
  set: 'OP-17',
  block: null,
  effectText:
    "[Blocker] (After your opponent declares an attack…)\n[On Play] Give up to 1 of your opponent's Characters −3000 poser.",
  triggerText: null,
  keywords: [],
  verified: false,
  verifiedBy: [],
  textFixes: [],
  artworks: [
    { artworkId: 'OP17-087', imageUrls: {}, source: 'optcgapi', product: 'OP-17', rarity: 'R' },
  ],
  legality: { standard: { status: 'unknown' }, extra: { status: 'unknown' } },
  sourceUrl: 'https://optcgapi.com/api/sets/card/OP17-087/',
  fetchedAt: '2026-10-28T00:00:00.000Z',
});
const SRC = 'https://en.onepiece-cardgame.com/cardlist/?series=569117';
const override = (o: Partial<Override>): Override => ({
  id: 'OP17-087',
  verified: true,
  sources: [
    {
      url: 'https://onepiece.limitlesstcg.com/cards/OP17-087',
      date: '2026-10-28',
      use: 'cross-check',
    },
  ],
  ...o,
});

describe('overrides', () => {
  it('applies fields, patches, keywords and verification, each audited', () => {
    const c = base();
    const r = applyOverride(
      c,
      override({
        keywords: ['Blocker'],
        fields: {
          name: { value: 'Nico Robin', upstream: 'Nico Robin', source: SRC },
          cost: { value: 3, upstream: 2, source: SRC },
        },
        textPatches: [{ field: 'effectText', find: 'poser', replace: 'power', source: SRC }],
      }),
    );
    expect(r.fatals).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(c.cost).toBe(3);
    expect(c.effectText).toContain('−3000 power');
    expect(c.keywords).toEqual(['Blocker']);
    expect(c.verified).toBe(true);
    expect(c.textFixes).toEqual([
      { field: 'cost', kind: 'override', from: '2', to: '3', source: SRC },
      { field: 'effectText', kind: 'override', from: 'poser', to: 'power', source: SRC },
    ]);
  });

  it('warns when upstream starts to agree, or changes again', () => {
    const agree = applyOverride(
      base(),
      override({ fields: { cost: { value: 2, upstream: 5, source: SRC } } }),
    );
    expect(agree.warnings[0]).toMatch(/upstream now agrees/);
    const changed = applyOverride(
      base(),
      override({ fields: { cost: { value: 3, upstream: 5, source: SRC } } }),
    );
    expect(changed.warnings[0]).toMatch(/upstream changed again/);
  });

  it('fails when a text patch no longer applies', () => {
    const r = applyOverride(
      base(),
      override({
        textPatches: [{ field: 'effectText', find: 'posr', replace: 'pow', source: SRC }],
      }),
    );
    expect(r.fatals[0]).toMatch(/no longer applies/);
    const fixed = applyOverride(
      base(),
      override({
        textPatches: [{ field: 'effectText', find: 'poserr', replace: 'poser', source: SRC }],
      }),
    );
    expect(fixed.warnings[0]).toMatch(/upstream now reads/);
  });

  it("fails when the text's keyword lines stop matching the verified keywords (E-D7)", () => {
    const r = applyOverride(base(), override({ keywords: ['Rush'] }));
    expect(r.fatals[0]).toMatch(/keyword lines are \[Blocker\]/);
  });
});
