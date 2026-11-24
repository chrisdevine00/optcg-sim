import type { CardScript } from '../../src/dsl.ts';

/** OP13-020 Meteor Fist. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_020: CardScript = {
  cardId: 'OP13-020',
  textHash: '06b83c335dc284',
  verified: {
    source: 'cards/overrides/OP13-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Up to 1 opposing Character -5000 power',
      kind: 'activate',
      when: 'main',
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
              amount: -5000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
