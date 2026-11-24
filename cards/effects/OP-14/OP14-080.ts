import type { CardScript } from '../../src/dsl.ts';

/** OP14-080 Gecko Moria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_080: CardScript = {
  cardId: 'OP14-080',
  textHash: '1b31815892d252',
  verified: {
    source: 'cards/overrides/OP14-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may K.O. 1 of your {Thriller Bark Pirates} Characters: your Leader and all your Characters gain +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          ko: {
            from: 'characters',
            owner: 'you',
            filter: {
              type: 'Thriller Bark Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        'You may trash 3 cards from your hand: add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
        },
      ],
      effect: [
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
      ],
    },
  ],
  rulings: [
    "reading: the Once Per Turn belongs to the [Activate: Main] only; the [When Attacking] has none. The K.O.'d Character is gone before the +1000 applies, so it gets none",
  ],
};
