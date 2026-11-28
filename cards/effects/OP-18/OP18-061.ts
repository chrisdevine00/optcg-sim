import type { CardScript } from '../../src/dsl.ts';

/** OP18-061 Iceburg. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_061: CardScript = {
  cardId: 'OP18-061',
  textHash: '0c757a4ac5e174',
  verified: {
    source: 'cards/overrides/OP18-061.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5 cards from the top of your deck; reveal up to a total of 2 Stage cards or {Water Seven} type cards and add them to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 2 },
                  filter: { any: [{ category: ['Stage'] }, { type: 'Water Seven' }] },
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
