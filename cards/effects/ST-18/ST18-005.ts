import type { CardScript } from '../../src/dsl.ts';

/** ST18-005 Luffy-Tarou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST18_005: CardScript = {
  cardId: 'ST18-005',
  textHash: '09a31be21f4aea',
  verified: {
    source: 'cards/overrides/ST18-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: play up to 1 purple {Straw Hat Crew} Character card with a cost of 5 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { color: 'Purple' },
                    { type: 'Straw Hat Crew' },
                    { cost: { lte: 5 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: DON!! -1 is the optional cost (its reminder text says "You may return"); the play is free, active, and the cost is the printed cost in hand',
  ],
};
