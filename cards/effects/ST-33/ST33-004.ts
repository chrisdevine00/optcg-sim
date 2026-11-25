import type { CardScript } from '../../src/dsl.ts';

/** ST33-004 Borsalino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST33_004: CardScript = {
  cardId: 'ST33-004',
  textHash: '0d62dfc8741b04',
  verified: {
    source: 'cards/overrides/ST33-004.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'hand-discount',
      label:
        'During the turn in which a card in your hand is trashed by an effect, give this card in your hand -3 cost',
      kind: 'permanent',
      zone: 'hand',
      conditions: [{ handTrashedThisTurn: 'you' }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
    },
  ],
  rulings: [
    'Reading (M6b-Q87): a card of your own hand trashed by an effect of either player counts, a cost included (M6b-Q31), at any time earlier in the same turn, also before this card was drawn; the discount ends with the turn. A card that leaves the hand some other way (played, returned to the deck) does not count',
  ],
};
