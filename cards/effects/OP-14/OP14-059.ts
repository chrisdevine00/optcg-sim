import type { CardScript } from '../../src/dsl.ts';

/** OP14-059 Please Take Me with You!! I Can Be of Great Help to You!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_059: CardScript = {
  cardId: 'OP14-059',
  textHash: '040a1cc6ed5d1b',
  verified: {
    source: 'cards/overrides/OP14-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'If your Leader is [Jinbe] and you have 2 or less cards in your hand, draw 2 cards',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  name: 'Jinbe',
                },
              },
              {
                cmp: [
                  {
                    hand: 'you',
                  },
                  '<=',
                  2,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 4 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 4,
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
};
