import type { CardScript } from '../../src/dsl.ts';

/** ST30-010 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_010: CardScript = {
  cardId: 'ST30-010',
  textHash: '1838df896a064d',
  verified: {
    source: 'cards/overrides/ST30-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's rested Characters will not become active in your opponent's next Refresh Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                state: 'rested',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
