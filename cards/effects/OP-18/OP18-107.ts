import type { CardScript } from '../../src/dsl.ts';

/** OP18-107 Nero. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_107: CardScript = {
  cardId: 'OP18-107',
  textHash: '1e7e2a1a5b5b78',
  verified: {
    source: 'cards/overrides/OP18-107.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", place up to 1 Character with a cost of 5 or less at the bottom of the owner\'s deck',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 5 } },
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
