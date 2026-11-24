import type { CardScript } from '../../src/dsl.ts';

/** OP12-026 Kuina. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_026: CardScript = {
  cardId: 'OP12-026',
  textHash: '1b9e7758124a3f',
  verified: {
    source: 'cards/overrides/OP12-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Rest this Character: rest up to 1 of your opponent's Characters with base cost 4 or less; then give up to 3 rested DON!! to your [Roronoa Zoro] Leader",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  lte: 4,
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
  rulings: [
    'Read: "Then" is not "If you do": the DON!! go out even when no Character was rested',
    'Read: "give up to 3" asks a count (None to 3); with a Leader not named [Roronoa Zoro] nothing is given',
  ],
};
