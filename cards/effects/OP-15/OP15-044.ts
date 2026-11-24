import type { CardScript } from '../../src/dsl.ts';

/** OP15-044 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_044: CardScript = {
  cardId: 'OP15-044',
  textHash: '023b965d1505bb',
  verified: {
    source: 'cards/overrides/OP15-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'Look at 3 cards; reveal up to 1 Dressrosa Event and add it to your hand; the rest to the bottom',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ type: 'Dressrosa' }, { category: ['Event'] }] },
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
};
