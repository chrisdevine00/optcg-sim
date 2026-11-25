import type { CardScript } from '../../src/dsl.ts';

/** ST26-002 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST26_002: CardScript = {
  cardId: 'ST26-002',
  textHash: '009b31b1e09d07',
  keywords: ['Blocker'],
  verified: {
    source: 'cards/overrides/ST26-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -2: rest up to 1 of your opponent's DON!! cards or Characters with a cost of 1 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 2 }],
      effect: [
        {
          do: {
            rest: {
              from: ['characters', 'donCostArea'],
              owner: 'opponent',
              filter: { cost: { lte: 1 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "with a cost of 1 or less" qualifies the Characters only (a DON!! card has no cost); only an active DON!! can be rested; DON!! -2 is the optional DON!! -X cost (RL-52); "up to 1" may rest nothing',
  ],
};
