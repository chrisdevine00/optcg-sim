import type { CardScript } from '../../src/dsl.ts';

/** OP18-065 Saint Gunko (Character). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_065: CardScript = {
  cardId: 'OP18-065',
  textHash: '1d688162ae7898',
  verified: {
    source: 'cards/overrides/OP18-065.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! −1: play up to 1 {Celestial Dragons} type Character card with 6000 power or less from your trash',
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
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Celestial Dragons',
                    },
                    {
                      power: {
                        lte: 6000,
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
    'block X on the official list is data (cards/overrides), not a rules matter; a card in the trash has its printed power',
  ],
};
