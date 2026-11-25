import type { CardScript } from '../../src/dsl.ts';

/** OP09-101 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_101: CardScript = {
  cardId: 'OP09-101',
  textHash: '062030131f120a',
  verified: {
    source: 'cards/overrides/OP09-101.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Place 1 of your opponent's Characters with a cost of 3 or less at the top or bottom of your opponent's Life cards face-up: your opponent trashes 1 card from their hand",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'opponent',
            filter: { cost: { lte: 3 } },
            pick: { exactly: 1 },
          },
          to: { zone: 'life', position: 'topOrBottom', faceUp: true },
        },
      ],
      effect: [
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: { exactly: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (R1, W57 review): the text before the colon is a cost, so the [On Play] may be declined (official general-rules Q&A: "if the effect has a cost, you can choose not to pay that cost and play the card without activating the effect", rules-digest 112); the engine asks to pay it, and an unpayable cost (no Character of cost 3 or less, or its removal stopped by "cannot be removed by your opponent\'s effects") means the effect does not resolve, so the opponent trashes nothing',
    'reading: the opponent chooses the card to trash (exactly 1); with an empty hand nothing is trashed',
  ],
};
