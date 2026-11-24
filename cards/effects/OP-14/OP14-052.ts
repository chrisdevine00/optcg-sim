import type { CardScript } from '../../src/dsl.ts';

/** OP14-052 Hannyabal. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_052: CardScript = {
  cardId: 'OP14-052',
  textHash: '0f2970c405aa01',
  verified: {
    source: 'cards/overrides/OP14-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 3 cards from your hand: play up to 1 {Impel Down} type Character card with a cost of 6 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
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
                      type: 'Impel Down',
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
      ],
    },
  ],
};
