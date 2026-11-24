import type { CardScript } from '../../src/dsl.ts';

/** OP11-063 Little Sadi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_063: CardScript = {
  cardId: 'OP11-063',
  textHash: '1475d3b3ff0d5c',
  verified: {
    source: 'cards/overrides/OP11-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -1: with an {Impel Down} Leader, rest up to 1 of your opponent's Characters with cost 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Impel Down',
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
                      lte: 3,
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
    'reading: the DON!! -1 is paid whether or not the Leader has the type (the "If" is after the colon)',
  ],
};
