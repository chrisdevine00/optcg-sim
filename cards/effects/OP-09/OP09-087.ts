import type { CardScript } from '../../src/dsl.ts';

/** OP09-087 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_087: CardScript = {
  cardId: 'OP09-087',
  textHash: '0d4e4da57ce866',
  verified: {
    source: 'cards/overrides/OP09-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'If your opponent has 5 or more cards in their hand, your opponent trashes 1 card from their hand',
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the hand size is public (the prompt does not depend on which cards are held); the opponent chooses the card',
  ],
};
