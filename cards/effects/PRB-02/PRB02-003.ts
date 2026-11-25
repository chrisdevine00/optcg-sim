import type { CardScript } from '../../src/dsl.ts';

/** PRB02-003 Lucky.Roux. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_003: CardScript = {
  cardId: 'PRB02-003',
  textHash: '0533d2a8c166ae',
  verified: {
    source: 'cards/overrides/PRB02-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 Character card with 6000 power or more from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { all: [{ category: ['Character'] }, { power: { gte: 6000 } }] },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [{ do: { draw: 2 } }],
    },
  ],
  rulings: [
    'reading: "6000 power or more" in the hand is the printed power; exactly 6000 qualifies; the cost is optional ("You may") and is payable only with such a Character in hand',
  ],
};
