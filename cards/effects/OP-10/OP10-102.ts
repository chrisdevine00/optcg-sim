import type { CardScript } from '../../src/dsl.ts';

/** OP10-102 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_102: CardScript = {
  cardId: 'OP10-102',
  textHash: '0fcefc3d04f7ac',
  verified: {
    source: 'cards/overrides/OP10-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Up to 3 of your Revolutionary Army Characters gain +1000 power during this turn; then add 1 card from the top of your Life cards to your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Revolutionary Army',
                },
                pick: {
                  upTo: 3,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Life card is added to the hand whether or not any Character was boosted ("Then" is not "If you do"); with no Life cards nothing is added',
  ],
};
