import type { CardScript } from '../../src/dsl.ts';

/** OP18-048 Mr.1 & Miss Doublefinger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_048: CardScript = {
  cardId: 'OP18-048',
  textHash: '128e39a11f13e1',
  verified: {
    source: 'cards/overrides/OP18-048.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'on-play',
      label:
        '[On Play] Play up to 1 Character card with a type including "Baroque Works" and a cost of 5 or less from your hand',
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
                    { typeIncludes: 'Baroque Works' },
                    { cost: { lte: 5 } },
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
