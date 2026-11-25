import type { CardScript } from '../../src/dsl.ts';

/** OP10-023 Issho. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_023: CardScript = {
  cardId: 'OP10-023',
  textHash: '147f19ce3a9374',
  verified: {
    source: 'cards/overrides/OP10-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the "Navy" type, rest up to 2 of your opponent\'s Characters with a cost of 5 or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 5,
                    },
                  },
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
