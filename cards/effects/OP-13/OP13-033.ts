import type { CardScript } from '../../src/dsl.ts';

/** OP13-033 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_033: CardScript = {
  cardId: 'OP13-033',
  textHash: '07833c1a952013',
  verified: {
    source: 'cards/overrides/OP13-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "Rest up to 2 of the opponent's cards",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters', 'stage', 'donCostArea'],
              owner: 'opponent',
              pick: { upTo: 2 },
            },
          },
        },
      ],
    },
  ],
};
