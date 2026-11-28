import type { CardScript } from '../../src/dsl.ts';

/** OP18-010 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_010: CardScript = {
  cardId: 'OP18-010',
  textHash: '1284f0c60d5416',
  verified: {
    source: 'cards/overrides/OP18-010.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Add up to 1 Character with 4000 power or less from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      power: {
                        lte: 4000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
};
