import type { CardScript } from '../../src/dsl.ts';

/** OP16-114 Laffitte. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_114: CardScript = {
  cardId: 'OP16-114',
  textHash: '149162acfea81b',
  verified: {
    source: 'cards/overrides/OP16-114.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
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
