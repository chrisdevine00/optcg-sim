import type { CardScript } from '../../src/dsl.ts';

/** ST16-004 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST16_004: CardScript = {
  cardId: 'ST16-004',
  textHash: '166cafad6a8471',
  verified: {
    source: 'cards/overrides/ST16-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "K.O. up to 1 of your opponent's rested Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
