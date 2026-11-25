import type { CardScript } from '../../src/dsl.ts';

/** OP10-007 Ceaser Soldier. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_007: CardScript = {
  cardId: 'OP10-007',
  textHash: '1b54a9e46d4255',
  verified: {
    source: 'cards/overrides/OP10-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 "Punk Hazard" Character card with a cost of 2 or less from your hand',
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
                      type: 'Punk Hazard',
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
};
