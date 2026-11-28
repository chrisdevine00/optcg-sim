import { describe, expect, it } from 'vitest';
import { TypeVocabulary } from '../scripts/types-vocab.ts';
import { assemble } from '../scripts/build.ts';
import {
  compareWithLimitless,
  limitlessRow,
  limitlessSetIds,
  parseLimitless,
} from '../scripts/limitless.ts';
import { formatLimitless, mergeLimitless } from '../scripts/update.ts';

/** A Limitless card page cut down to the parts the parser reads (structure as served 2026-11-27). */
const page = (o: {
  id: string;
  name: string;
  type: string;
  stats?: string;
  text: string;
  types: string;
  rarity: string;
}) => `<div class="card-text">
    <div class="card-text-section">
        <p class="card-text-title">
            <span class="card-text-name"><a href="/cards/${o.id}">${o.name}</a></span>
            <span class="card-text-id">${o.id}</span>
        </p>
        <p class="card-text-type">${o.type}</p>
    </div>
    ${o.stats ? `<p class="card-text-section">${o.stats}</p>` : ''}
    <div class="card-text-section">${o.text}</div>
    <div class="card-text-section"><span data-tooltip="Type">${o.types}</span></div>
    <div class="card-text-section card-text-artist">Illustrated by <a href="#">Someone</a></div>
</div>
<div class="card-legality"><div class="regulation-mark">
     Block 5</div></div>
<div class="card-prints"><div class="card-prints-current"><a href=/cards/op18-the-dominance-of-god>
  <div class="prints-current-details">
    <span class="text-lg">
        The Dominance of God
         (OP18)                 </span>
    <span>
         ${o.rarity}
                        </span>
  </div></a></div></div>`;

const franky = page({
  id: 'OP18-021',
  name: 'Franky',
  type: '<span data-tooltip="Category">Leader</span> • <span data-tooltip="Color">Green/Purple</span> • 4 Life',
  stats: '5000 Power • <span data-tooltip="Attribute">Strike</span>',
  text: 'All Stage cards in your hand have a +3000 Counter.<br>[Activate: Main] [Once Per Turn] DON!! −1: Play up to 1 Stage card with a cost of 5 or less from your hand.',
  types: 'Water Seven/The Franky Family/Straw Hat Crew',
  rarity: 'Leader',
});

const event = page({
  id: 'OP18-116',
  name: 'Iron Body Empty Tree',
  type: '<span data-tooltip="Category">Event</span> • <span data-tooltip="Color">Yellow</span> • 0 Cost',
  text: '[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters gains +3000 power during this battle.<br>[Trigger] If your Leader&#039;s type includes &quot;CP&quot;, rest up to 1 of your opponent&#039;s Characters.',
  types: 'CP9',
  rarity: 'Common',
});

describe('Limitless card pages as a source (ADR 0015)', () => {
  it('parses rarity and product from the base printing', () => {
    const l = parseLimitless(franky);
    expect(l).toMatchObject({ id: 'OP18-021', rarity: 'Leader', product: 'The Dominance of God' });
    expect(l).toMatchObject({ life: 4, power: 5000, block: '5' });
  });

  it('turns a page into an optcgapi-shaped row: printed codes, slash types, trigger rejoined', () => {
    const row = limitlessRow(parseLimitless(event), 'OP-18');
    expect(row).toMatchObject({
      card_set_id: 'OP18-116',
      card_type: 'Event',
      card_cost: '0',
      card_power: null,
      rarity: 'C',
      set_id: 'OP-18',
      set_name: 'The Dominance of God',
      card_image: null,
    });
    expect(row.card_text).toMatch(/battle\.\n\[Trigger\] If your Leader's type includes "CP"/);
  });

  it('refuses a rarity it does not know instead of guessing', () => {
    const odd = franky.replace('         Leader\n', '         Mythic\n');
    expect(() => limitlessRow(parseLimitless(odd), 'OP-18')).toThrow(/unknown Limitless rarity/);
  });

  it('assembles through the normalizer into a card with its source and no image', () => {
    const rows = [franky, event].map((h) => ({
      ...limitlessRow(parseLimitless(h), 'OP-18'),
      file: 'limitless' as const,
      fetchedAt: '2026-11-27T00:00:00.000Z',
    }));
    const vocab = new TypeVocabulary(rows.map((r) => r.sub_types ?? ''));
    const asm = assemble(rows, vocab);
    expect(asm.issues.filter((i) => i.level === 'fatal')).toEqual([]);
    const f = asm.cards.get('OP18-021')!;
    expect(f).toMatchObject({
      dataSource: 'limitless',
      sourceUrl: 'https://onepiece.limitlesstcg.com/cards/OP18-021',
      types: ['Water Seven', 'The Franky Family', 'Straw Hat Crew'],
      textFixes: [],
    });
    expect(f.artworks).toEqual([
      { artworkId: 'OP18-021', imageUrls: {}, source: 'none', product: 'OP-18', rarity: 'L' },
    ]);
    const e = asm.cards.get('OP18-116')!;
    expect(e.triggerText).toBe(
      'If your Leader\'s type includes "CP", rest up to 1 of your opponent\'s Characters.',
    );
    // The card agrees with its own page, which is what the optcgapi cross-check compares against.
    expect(compareWithLimitless(f, parseLimitless(franky))).toEqual([]);
  });

  it('lists only the product own card numbers from a set page', () => {
    const html =
      '<a href="/cards/OP18-002">a</a><a href="/cards/OP18-001">b</a><a href="/cards/OP17-040">reprint</a><a href="/cards/OP18-001?v=1">alt</a>';
    expect(limitlessSetIds(html, 'OP18')).toEqual(['OP18-001', 'OP18-002']);
  });

  it('reports cards optcgapi now has, with their differences, and when to drop the product', () => {
    const text = formatLimitless([
      {
        code: 'OP-18',
        fromLimitless: [],
        inOptcgapi: [
          { id: 'OP18-001', differences: [] },
          { id: 'OP18-002', differences: ['cost: ours 3 | limitless 4'] },
        ],
      },
    ]);
    expect(text).toContain(
      'OP-18: 2 cards now come from optcgapi; 1 differ from their Limitless page',
    );
    expect(text).toContain('OP18-002\n      cost: ours 3 | limitless 4');
    expect(text).toContain('remove it from LIMITLESS_PRODUCTS');
  });

  it('prefers optcgapi card by card once it has a set or starter row; a promo row does not count', () => {
    const lim = (id: string) => ({
      id,
      url: '',
      fetchedAt: '2026-11-27T00:00:00.000Z',
      page: parseLimitless(franky),
      row: { ...limitlessRow(parseLimitless(franky), 'OP-18'), card_set_id: id, card_image_id: id },
    });
    const optcg = (id: string, file: 'sets' | 'promos') => ({
      ...limitlessRow(parseLimitless(franky), 'OP-18'),
      card_set_id: id,
      card_image_id: id,
      file,
      fetchedAt: '2026-11-27T00:00:00.000Z',
    });
    const { inOptcgapi, added } = mergeLimitless(
      [optcg('OP18-001', 'sets'), optcg('OP18-002_p1', 'sets'), optcg('OP18-003', 'promos')],
      [{ cards: ['OP18-001', 'OP18-002', 'OP18-003', 'OP18-004'].map(lim) }],
    );
    expect([...inOptcgapi].sort()).toEqual(['OP18-001', 'OP18-002']);
    expect(added.map((r) => [r.card_set_id, r.file])).toEqual([
      ['OP18-003', 'limitless'],
      ['OP18-004', 'limitless'],
    ]);
  });
});
