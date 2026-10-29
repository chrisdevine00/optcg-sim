import type { CardScript } from '../../src/dsl.ts';

/** OP17-074 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_074: CardScript = {
  cardId: 'OP17-074',
  textHash: '18553b0ec59e7c',
  verified: {
    source: 'cards/overrides/OP17-074.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
