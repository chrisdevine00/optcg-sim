import type { CardScript } from '../../src/dsl.ts';

/** ST30-003 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_003: CardScript = {
  cardId: 'ST30-003',
  textHash: '05190ccb1475a2',
  verified: {
    source: 'cards/overrides/ST30-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'aura',
      label: 'Your Turn: all your Characters with 6000 base power gain +1000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                basePower: {
                  eq: 6000,
                },
              },
            },
            amount: 1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: it counts itself (printed 6000); the filter reads base power, so a Character whose power another effect changed still counts by its base',
  ],
};
