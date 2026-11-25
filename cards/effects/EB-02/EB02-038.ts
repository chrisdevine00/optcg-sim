import type { CardScript } from '../../src/dsl.ts';

/** EB02-038 Magellan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_038: CardScript = {
  cardId: 'EB02-038',
  textHash: '0ebc1f0f9d359d',
  verified: {
    source: 'cards/overrides/EB02-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 {Impel Down} Character with a cost of 2 or less from your hand',
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
                      type: 'Impel Down',
                    },
                    {
                      cost: {
                        lte: 2,
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
  rulings: [
    'Read: the pick is asked with a hand that holds no match (at max 0), so the opponent learns nothing about the hand (hidden-gate rule)',
  ],
};
