import type { CardScript } from '../../src/dsl.ts';

/** OP17-022 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_022: CardScript = {
  cardId: 'OP17-022',
  textHash: '1f6a4707f5d192',
  verified: {
    source: 'cards/overrides/OP17-022.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'on-play',
      label: "Set up to 2 DON!! active; then rest all of your opponent's Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 2,
              },
            },
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
            },
          },
        },
      ],
    },
  ],
};
