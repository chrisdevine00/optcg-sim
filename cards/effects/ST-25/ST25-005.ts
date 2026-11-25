import type { CardScript } from '../../src/dsl.ts';

/** ST25-005 Mohji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST25_005: CardScript = {
  cardId: 'ST25-005',
  textHash: '1e55e7219a5374',
  verified: {
    source: 'cards/overrides/ST25-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-and-cost',
      label:
        'With 2 or more Characters with a base cost of 5 or more, this Character gains [Blocker] and +1 cost',
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
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        { cost: { target: { from: 'self', owner: 'you' }, amount: 1 } },
      ],
    },
    {
      id: 'on-ko',
      label: 'If your Leader is [Buggy] and you have 3 or less cards in your hand, draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { all: [{ leader: { name: 'Buggy' } }, { cmp: [{ hand: 'you' }, '<=', 3] }] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'Reading: Mohji is base cost 4 and never counts toward his own condition; base cost is the printed cost (the +1 does not feed it); [Blocker] is gained, not printed, so keywords stays empty',
    'reading: "If your Leader is [Buggy] and you have 3 or less cards in your hand" follows no colon: an effect condition read when the [On K.O.] resolves (the hand is counted then)',
  ],
};
