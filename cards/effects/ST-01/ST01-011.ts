import type { CardScript } from '../../src/dsl.ts';

/** ST01-011 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST01_011: CardScript = {
  cardId: 'ST01-011',
  textHash: '036c8400aa26e8',
  verified: {
    source: 'cards/overrides/ST01-011.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 2 rested DON!! cards to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
