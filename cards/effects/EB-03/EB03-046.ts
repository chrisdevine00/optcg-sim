import type { CardScript } from '../../src/dsl.ts';

/** EB03-046 Miss Doublefinger(Zala). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_046: CardScript = {
  cardId: 'EB03-046',
  textHash: '05b24ccbccf24d',
  verified: {
    source: 'cards/overrides/EB03-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If there is a Character with a cost of 0 or a cost of 8 or more, draw 1',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: { any: [{ cost: { lte: 0 } }, { cost: { gte: 8 } }] },
            },
          },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Trash 2 cards from the top of your deck',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { mill: { player: 'you', n: 2 } } }],
    },
  ],
  rulings: [
    'Reading: "a Character" is any Character on either side, this one included; cost is the current cost (a cost-reduced Character reaches 0, a cost-raised one reaches 8)',
  ],
};
