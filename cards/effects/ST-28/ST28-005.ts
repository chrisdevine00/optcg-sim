import type { CardScript } from '../../src/dsl.ts';

/** ST28-005 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST28_005: CardScript = {
  cardId: 'ST28-005',
  textHash: '15f26a2ccb58e9',
  verified: {
    source: 'cards/overrides/ST28-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'your-turn-power',
      label: '[DON!! x2] [Your Turn] This Character gains +3000 power',
      kind: 'permanent',
      conditions: [{ donGiven: 2 }, { yourTurn: true }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 3000 } }],
    },
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Land of Wano} card with a cost of 2 or more and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ type: 'Land of Wano' }, { cost: { gte: 2 } }] },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: any category of "Land of Wano" type card may be taken; "a cost of 2 or more" is the printed cost in the deck (a card with no cost, as a Leader, never matches)',
  ],
};
