import type { CardScript } from '../../src/dsl.ts';

/** OP17-110 Charlotte Perospero. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_110: CardScript = {
  cardId: 'OP17-110',
  textHash: '1cc6fbed810593',
  verified: {
    source: 'cards/overrides/OP17-110.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Big Mom Pirates} Character with a cost of 6 or less from your hand; this gains [Rush]',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
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
                      type: 'Big Mom Pirates',
                    },
                    {
                      cost: {
                        lte: 6,
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
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
