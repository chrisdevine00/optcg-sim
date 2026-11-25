import type { CardScript } from '../../src/dsl.ts';

/** EB03-007 Baccarat. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_007: CardScript = {
  cardId: 'EB03-007',
  textHash: '0d8410d4e577d6',
  verified: {
    source: 'cards/overrides/EB03-007.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 Character with 6000 power or less and no base effect from your hand',
      kind: 'auto',
      when: ['onKO'],
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
                    { power: { lte: 6000 } },
                    { hasBaseEffect: false },
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
