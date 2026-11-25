import type { CardScript } from '../../src/dsl.ts';

/** OP10-046 Kyros. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_046: CardScript = {
  cardId: 'OP10-046',
  textHash: '0984375407f132',
  verified: {
    source: 'cards/overrides/OP10-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Return up to 1 Character with a cost of 5 or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: either player's Character, including your own and this Character (cost 7, so never a candidate)",
  ],
};
