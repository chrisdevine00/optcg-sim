import type { CardScript } from '../../src/dsl.ts';

/** OP13-115 Paper Art Afterimage. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_115: CardScript = {
  cardId: 'OP13-115',
  textHash: '110b57857f5f7e',
  verified: {
    source: 'cards/overrides/OP13-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 Leader or Character +3000 this battle; then if opponent has 2 or less Life, up to 1 Leader or Character +1000 this turn',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                life: 'opponent',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
};
