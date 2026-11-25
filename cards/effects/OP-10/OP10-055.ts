import type { CardScript } from '../../src/dsl.ts';

/** OP10-055 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_055: CardScript = {
  cardId: 'OP10-055',
  textHash: '1523218ebd2a68',
  verified: {
    source: 'cards/overrides/OP10-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        "Return up to 1 of your opponent's Characters with a cost of 4 or less to the owner's hand",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 4,
                  },
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
