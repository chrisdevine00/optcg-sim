import type { CardScript } from '../../src/dsl.ts';

/** OP15-041 Orlumbus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_041: CardScript = {
  cardId: 'OP15-041',
  textHash: '00923f72a040f5',
  verified: {
    source: 'cards/overrides/OP15-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
    {
      id: 'rush',
      label: 'Place 1 of your Characters at the bottom of the deck: this Character gains [Rush]',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "1 of your Characters" may be Orlumbus himself (then he is gone and the [Rush] has no target)',
  ],
};
