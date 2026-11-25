import type { CardScript } from '../../src/dsl.ts';

/** OP10-077 Bellamy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_077: CardScript = {
  cardId: 'OP10-077',
  textHash: '07a56214839bd4',
  verified: {
    source: 'cards/overrides/OP10-077.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-block',
      label: 'Rest 2 of your DON!!: add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onBlock'],
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
