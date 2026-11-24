import type { CardScript } from '../../src/dsl.ts';

/** OP15-007 Gin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_007: CardScript = {
  cardId: 'OP15-007',
  textHash: '03ca7ae2f18747',
  verified: {
    source: 'cards/overrides/OP15-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the East Blue type, play up to 1 Character with a cost of 5 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ leader: { type: 'East Blue' } }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ category: ['Character'] }, { cost: { lte: 5 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
