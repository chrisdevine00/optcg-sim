import type { CardScript } from '../../src/dsl.ts';

/** OP18-023 Gaimon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_023: CardScript = {
  cardId: 'OP18-023',
  textHash: '01198dbd3095af',
  verified: {
    source: 'cards/overrides/OP18-023.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your {East Blue} Leader or Characters gains [Banish] this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'East Blue',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Banish',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
