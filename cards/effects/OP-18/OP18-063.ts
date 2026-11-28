import type { CardScript } from '../../src/dsl.ts';

/** OP18-063 Kiwi & Mozu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_063: CardScript = {
  cardId: 'OP18-063',
  textHash: '1077864c8752f4',
  verified: {
    source: 'cards/overrides/OP18-063.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may K.O. 1 of your Stages with a cost of 5 or less: add up to 1 DON!! card as rested from your DON!! deck',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          ko: {
            from: 'stage',
            owner: 'you',
            filter: {
              cost: {
                lte: 5,
              },
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
      ],
    },
  ],
  rulings: [
    'OP-18 wave G2: a K.O. cost may K.O. your own Stage (a real K.O., so "cannot be K.O.\'d" stops it)',
  ],
};
