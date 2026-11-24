import type { CardScript } from '../../src/dsl.ts';

/** OP14-064 Giolla. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_064: CardScript = {
  cardId: 'OP14-064',
  textHash: '16d573e105a227',
  verified: {
    source: 'cards/overrides/OP14-064.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "Add up to 1 DON!! rested, then K.O. up to 1 of your opponent's Characters with a base power of 0",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  eq: 0,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is sequential, not "If you do": the K.O. happens whether or not a DON!! was added',
  ],
};
