import type { CardScript } from '../../src/dsl.ts';

/** OP16-102 Avalo Pizarro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_102: CardScript = {
  cardId: 'OP16-102',
  textHash: '0cd916a0503cb5',
  verified: {
    source: 'cards/overrides/OP16-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 1, then play up to 1 [Fullalead] from your hand or trash',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            play: {
              what: {
                from: ['hand', 'trash'],
                owner: 'you',
                filter: { name: 'Fullalead' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [On K.O.] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'onKO', of: 'self' } } }],
    },
  ],
  rulings: [
    'reading: "then" after the comma is not "If you do": the play step happens whatever the draw did',
  ],
};
