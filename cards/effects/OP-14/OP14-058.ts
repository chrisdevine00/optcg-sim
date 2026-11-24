import type { CardScript } from '../../src/dsl.ts';

/** OP14-058 Ocean Current Shoulder Throw. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_058: CardScript = {
  cardId: 'OP14-058',
  textHash: '1ef251ebb6a047',
  verified: {
    source: 'cards/overrides/OP14-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 3 of your DON!!: play up to 1 {Fish-Man} Character with a cost of 3 or less from your hand; then return up to 1 Character with 6000 base power to the owner's hand",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 3,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Fish-Man',
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
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  basePower: {
                    eq: 6000,
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
    {
      id: 'counter',
      label: 'Draw 1 card and your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
