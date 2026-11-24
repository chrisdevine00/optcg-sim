import type { CardScript } from '../../src/dsl.ts';

/** OP14-043 Aladine. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_043: CardScript = {
  cardId: 'OP14-043',
  textHash: '0bd2007ec1c259',
  verified: {
    source: 'cards/overrides/OP14-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Fish-Man} or {Merfolk} type Character card with a cost of 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
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
                      any: [
                        {
                          type: 'Fish-Man',
                        },
                        {
                          type: 'Merfolk',
                        },
                      ],
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
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
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
