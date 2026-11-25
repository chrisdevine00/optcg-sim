import type { CardScript } from '../../src/dsl.ts';

/** EB02-045 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_045: CardScript = {
  cardId: 'EB02-045',
  textHash: '063506653f7a9c',
  verified: {
    source: 'cards/overrides/EB02-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may place 2 cards from your trash at the bottom of your deck in any order: choose one: draw 1; or, if your opponent has 5 or more cards in hand, they trash 1',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  draw: 1,
                },
              },
            ],
            [
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
          ],
          labels: [
            'Draw 1 card',
            'If your opponent has 5 or more cards in their hand, your opponent trashes 1 card from their hand',
          ],
        },
      ],
    },
  ],
  rulings: [
    'Read (as OP12-060): the second mode may be chosen and do nothing (the hand size is public and read when the mode resolves, after the cost); the opponent chooses the card they trash',
    'Read: the 2 trash cards are an exact cost, not offered with fewer than 2; the owner orders them at the bottom',
  ],
};
