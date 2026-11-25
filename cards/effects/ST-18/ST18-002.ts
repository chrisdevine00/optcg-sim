import type { CardScript } from '../../src/dsl.ts';

/** ST18-002 O-Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST18_002: CardScript = {
  cardId: 'ST18-002',
  textHash: '122b83c663ac63',
  verified: {
    source: 'cards/overrides/ST18-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 8 or more DON!! cards on your field, trash 1 card from your hand and draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '>=', 8] },
          then: [
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
            { do: { draw: 2 } },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "trash 1 card from your hand and draw 2 cards" is two independent instructions (not "if you do"): with an empty hand nothing is trashed and the 2 cards are still drawn; the trash is mandatory, asked at exactly 1',
  ],
};
