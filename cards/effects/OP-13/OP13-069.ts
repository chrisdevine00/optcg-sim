import type { CardScript } from '../../src/dsl.ts';

/** OP13-069 Tom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_069: CardScript = {
  cardId: 'OP13-069',
  textHash: '1b4904eda2c9a7',
  verified: {
    source: 'cards/overrides/OP13-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: add up to 1 Stage card with a cost of 3 or less from your trash to your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Stage'],
                    },
                    {
                      cost: {
                        lte: 3,
                      },
                    },
                  ],
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
    'reading: DON!! -1 is the optional DON!! -X cost (RL-52); the Stage is chosen from the trash (public), inclusive at cost 3',
  ],
};
