import type { CardScript } from '../../src/dsl.ts';

/** EB02-057 Mad Treasure. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_057: CardScript = {
  cardId: 'EB02-057',
  textHash: '0fbf8017df0e37',
  verified: {
    source: 'cards/overrides/EB02-057.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "You may add 1 card from the top or bottom of your Life cards to your hand: add up to 1 of your opponent's Characters with a cost of 3 or less to the top or bottom of your opponent's Life cards face-up",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 3,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'topOrBottom',
                faceUp: true,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "You may add 1 card from the top or bottom of your Life cards to your hand" is the optional cost (you choose the end); it is payable only with a Life card',
    "reading (G61, M6b-Q78): the Character goes to the top or bottom (the attacker chooses) of its owner's, that is the opponent's, Life face-up; it is a removal, so the opponent's protection from removal applies; \"up to 1\" may pick none, and the Life card is spent anyway",
  ],
};
