import type { CardScript } from '../../src/dsl.ts';

/** OP13-080 St. Ethanbaron V. Nusjuro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_080: CardScript = {
  cardId: 'OP13-080',
  textHash: '0ac26bc929855d',
  verified: {
    source: 'cards/overrides/OP13-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trash-shield',
      label:
        "With 7 or more cards in your trash, this Character cannot be removed by your opponent's effects and gains [Rush]",
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            7,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        "With 10 or more cards in your trash: give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            cmp: [
              {
                trash: 'you',
              },
              '>=',
              10,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the [Rush] is conditional (no printed keyword), so with fewer than 7 cards in the trash it cannot attack the turn it is played; "removed from the field" covers K.O., trash, return to hand and deck by the opponent\'s effects only (battle K.O. and the owner\'s own effects still work); the trash counts are inclusive at 7 and 10',
  ],
};
