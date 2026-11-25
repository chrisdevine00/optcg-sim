import type { CardScript } from '../../src/dsl.ts';

/** OP09-105 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_105: CardScript = {
  cardId: 'OP09-105',
  textHash: '0bea2c2a796fad',
  verified: {
    source: 'cards/overrides/OP09-105.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      kind: 'trigger',
      label:
        'If your Leader has the {Egghead} type, add up to 1 card from the top of your deck to the top of your Life cards, then trash 2 cards from your hand',
      effect: [
        {
          if: {
            leader: {
              type: 'Egghead',
            },
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'deckTop',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'top',
                  },
                },
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
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
  rulings: [
    'reading (B3A-R1, M4b-5): no colon, so the "If" is an effect condition; "Then, trash 2 cards" is inside the guard; the card is added to Life face-down (not face-up); with fewer than 2 cards in hand all of them are trashed',
  ],
};
