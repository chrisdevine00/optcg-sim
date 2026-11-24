import type { CardScript } from '../../src/dsl.ts';

/** OP13-021 Gum-Gum Gatling Gun. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_021: CardScript = {
  cardId: 'OP13-021',
  textHash: '0f7507d9d87910',
  verified: {
    source: 'cards/overrides/OP13-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Give up to 1 rested DON!! to 1 of your [Monkey.D.Luffy] cards; then up to 1 opposing Character -2000',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
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
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 opposing Character -2000 power',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
