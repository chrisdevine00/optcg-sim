import type { CardScript } from '../../src/dsl.ts';

/** OP15-045 Sai. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_045: CardScript = {
  cardId: 'OP15-045',
  textHash: '0064b1f59e7083',
  verified: {
    source: 'cards/overrides/OP15-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 Event from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { category: ['Event'] },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
