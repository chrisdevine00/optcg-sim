import type { CardScript } from '../../src/dsl.ts';

/** OP09-111 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_111: CardScript = {
  cardId: 'OP09-111',
  textHash: '0308471c779116',
  verified: {
    source: 'cards/overrides/OP09-111.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      kind: 'trigger',
      label:
        'If your Leader has the {Egghead} type and your opponent has 6 or more cards in their hand, your opponent trashes 2 cards from their hand',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Egghead',
                },
              },
              {
                cmp: [
                  {
                    hand: 'opponent',
                  },
                  '>=',
                  6,
                ],
              },
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
                    exactly: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['reading: the opponent chooses the 2 cards; the hand size 6 is the boundary'],
};
