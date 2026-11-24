import type { CardScript } from '../../src/dsl.ts';

/** OP12-031 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_031: CardScript = {
  cardId: 'OP12-031',
  textHash: '00b5f1036c2b6f',
  verified: {
    source: 'cards/overrides/OP12-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters with base cost 6 or less; then give up to 3 rested DON!! to your [Roronoa Zoro] Leader",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  lte: 6,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 3,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Roronoa Zoro',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['Read: "Then" is not "If you do": the DON!! go out even when no Character was rested'],
};
