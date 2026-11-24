import type { CardScript } from '../../src/dsl.ts';

/** OP16-110 Vasco Shot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_110: CardScript = {
  cardId: 'OP16-110',
  textHash: '003f1935746a29',
  verified: {
    source: 'cards/overrides/OP16-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "Draw 1 and rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 6 } },
              pick: { upTo: 1 },
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
};
