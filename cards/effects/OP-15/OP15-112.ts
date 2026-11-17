import type { CardScript } from '../../src/dsl.ts';

/** OP15-112 Raki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_112: CardScript = {
  cardId: 'OP15-112',
  textHash: '16a8edd2219b94',
  verified: {
    source: 'cards/overrides/OP15-112.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 {Shandian Warrior} Character with cost 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Shandian Warrior' },
                    { cost: { lte: 3 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
