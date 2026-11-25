import type { CardScript } from '../../src/dsl.ts';

/** ST25-001 Alvida. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST25_001: CardScript = {
  cardId: 'ST25-001',
  textHash: '0ba54e6b34e820',
  verified: {
    source: 'cards/overrides/ST25-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label:
        'With 2 or more Characters with a base cost of 5 or more, this Character gains +1 cost',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'characters', owner: 'you', filter: { baseCost: { gte: 5 } } } },
            '>=',
            2,
          ],
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 1 } }],
    },
    {
      id: 'on-play',
      label: 'If your Leader is [Buggy], draw 3 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { name: 'Buggy' } },
          then: [
            { do: { draw: 3 } },
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (as OP12-042): Alvida is base cost 4 and never counts toward her own condition; base cost is the printed cost (the +1 does not feed it); the Characters counted are your own',
    'reading: "If your Leader is [Buggy]" follows no colon: an effect condition read when the effect resolves; the draw and the trash are both inside it ("trash 2 cards from your hand" is exact, as many as the hand holds)',
  ],
};
