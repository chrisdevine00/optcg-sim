import type { CardScript } from '../../src/dsl.ts';

/** OP18-115 Ten Finger Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_115: CardScript = {
  cardId: 'OP18-115',
  textHash: '0f31f1e76e0a78',
  verified: {
    source: 'cards/overrides/OP18-115.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'main',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 5 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", draw 1 card and place up to 1 Character with a cost of 7 or less at the bottom of the owner\'s deck',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 7 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'deck', position: 'bottom' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
