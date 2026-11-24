import type { CardScript } from '../../src/dsl.ts';

/** OP14-006 Shachi & Penguin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_006: CardScript = {
  cardId: 'OP14-006',
  textHash: '1c3cfcdc2f8310',
  verified: {
    source: 'cards/overrides/OP14-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "If this has 5000 power or more, give up to 1 of the opponent's Characters -2000 power",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          self: {
            power: {
              gte: 5000,
            },
          },
        },
      ],
      effect: [
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
  rulings: ['reading: current power incl. given DON!!, checked at the trigger and at resolution'],
};
