import type { CardScript } from '../../src/dsl.ts';

/** OP18-012 Pincers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_012: CardScript = {
  cardId: 'OP18-012',
  textHash: '148c9d67379f37',
  verified: {
    source: 'cards/overrides/OP18-012.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'attack',
      label: 'Up to 1 of your {Animal} and {Alabasta} Characters gains +1000 power this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'Animal',
                    },
                    {
                      type: 'Alabasta',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
