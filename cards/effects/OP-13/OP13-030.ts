import type { CardScript } from '../../src/dsl.ts';

/** OP13-030 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_030: CardScript = {
  cardId: 'OP13-030',
  textHash: '08209aec6b537b',
  verified: {
    source: 'cards/overrides/OP13-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Set up to 2 DON!! active',
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
      ],
    },
  ],
};
