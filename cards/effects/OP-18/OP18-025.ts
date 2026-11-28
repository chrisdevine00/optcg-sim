import type { CardScript } from '../../src/dsl.ts';

/** OP18-025 Gonbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_025: CardScript = {
  cardId: 'OP18-025',
  textHash: '0d0a000988edc3',
  verified: {
    source: 'cards/overrides/OP18-025.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'end',
      label: 'If this Character is rested, set your Leader as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            self: {
              state: 'rested',
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'leader',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
