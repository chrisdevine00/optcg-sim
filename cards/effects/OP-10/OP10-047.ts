import type { CardScript } from '../../src/dsl.ts';

/** OP10-047 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_047: CardScript = {
  cardId: 'OP10-047',
  textHash: '0244c7cc47455d',
  verified: {
    source: 'cards/overrides/OP10-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        "You may return 1 of your {Revolutionary Army} Characters with a cost of 3 or more to the owner's hand: this Character gains +3000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'Revolutionary Army',
                },
                {
                  cost: {
                    gte: 3,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "cost of 3 or more" is the current cost; Koala (cost 2) can never pay with herself',
  ],
};
