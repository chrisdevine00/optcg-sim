import type { CardScript } from '../../src/dsl.ts';

/** ST34-002 Charlotte Cracker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST34_002: CardScript = {
  cardId: 'ST34-002',
  textHash: '18786005f5b8f6',
  verified: {
    source: 'cards/overrides/ST34-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {Big Mom Pirates} type, add up to 1 DON!! from your DON!! deck and rest it. Then, K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Big Mom Pirates',
            },
          },
          then: [
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
                    cost: {
                      lte: 2,
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
    },
  ],
  rulings: [
    'reading: "Then" sits inside the leading "If": without a {Big Mom Pirates} Leader neither step happens (OP16 review, M4b-5)',
  ],
};
