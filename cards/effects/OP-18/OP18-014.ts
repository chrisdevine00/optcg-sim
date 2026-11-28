import type { CardScript } from '../../src/dsl.ts';

/** OP18-014 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_014: CardScript = {
  cardId: 'OP18-014',
  textHash: '02652127cdc18d',
  verified: {
    source: 'cards/overrides/OP18-014.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'attack',
      label: 'Up to 1 of your {Alabasta} Characters gains [Rush] this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Alabasta',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Q12: the reminder text after the effect line is not part of the effect (checked against the official list, OP-18 series page)',
  ],
};
