import type { CardScript } from '../../src/dsl.ts';

/** OP10-092 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_092: CardScript = {
  cardId: 'OP10-092',
  textHash: '031cec2ecc6b26',
  verified: {
    source: 'cards/overrides/OP10-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Place 2 Thriller Bark Pirates cards from your trash at the bottom of your deck in any order: up to 1 of your Characters other than [Perona] gains +2000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            filter: {
              type: 'Thriller Bark Pirates',
            },
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
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  not: {
                    name: 'Perona',
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "cards" with a Thriller Bark Pirates type means any card category in the trash; the owner orders the two cards at the deck bottom; the cost needs two such cards in the trash',
  ],
};
