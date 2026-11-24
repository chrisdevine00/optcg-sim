import type { CardScript } from '../../src/dsl.ts';

/** OP13-074 Hera. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_074: CardScript = {
  cardId: 'OP13-074',
  textHash: '1343645de7d3b3',
  verified: {
    source: 'cards/overrides/OP13-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 [Homies] Character card with 3000 power or less from your hand',
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
                      type: 'Homies',
                    },
                    {
                      power: {
                        lte: 3000,
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
    'reading: "[Homies] type" is the exact type {Homies}; power in hand is the printed power, inclusive at 3000; the hand pick is asked (max 0 with no candidate), never gated on the hand',
  ],
};
