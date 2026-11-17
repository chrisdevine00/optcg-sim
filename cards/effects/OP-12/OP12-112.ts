import type { CardScript } from '../../src/dsl.ts';

/** OP12-112 Baby 5. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_112: CardScript = {
  cardId: 'OP12-112',
  textHash: '133155a55dd0be',
  verified: {
    source: 'cards/overrides/OP12-112.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'If your Leader is multicolored, draw 2 cards',
      kind: 'trigger',
      effect: [
        {
          if: {
            leader: {
              multicolor: true,
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
};
