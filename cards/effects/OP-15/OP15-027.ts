import type { CardScript } from '../../src/dsl.ts';

/** OP15-027 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_027: CardScript = {
  cardId: 'OP15-027',
  textHash: '1b0b20c529645c',
  verified: {
    source: 'cards/overrides/OP15-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters with a DON!! card given",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { donGiven: { gte: 1 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
