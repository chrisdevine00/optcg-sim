import type { CardScript } from '../../src/dsl.ts';

/** OP01-055 You Can Be My Samurai!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP01_055: CardScript = {
  cardId: 'OP01-055',
  textHash: '12a8b892c49fb3',
  verified: {
    source: 'cards/overrides/OP01-055.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label: 'You may rest 2 of your Characters: draw 2 cards',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          rest: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
  rulings: [
    'CR 1-3-2-1: only active Characters can be rested to pay; with fewer than 2 active the cost is unpayable',
  ],
};
