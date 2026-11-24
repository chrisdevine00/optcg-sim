import type { CardScript } from '../../src/dsl.ts';

/** OP15-036 Ryuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_036: CardScript = {
  cardId: 'OP15-036',
  textHash: '121223d0fa917c',
  verified: {
    source: 'cards/overrides/OP15-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { all: [{ state: 'rested' }, { cost: { lte: 4 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
