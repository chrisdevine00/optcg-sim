import type { CardScript } from '../../src/dsl.ts';

/** ST29-002 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_002: CardScript = {
  cardId: 'ST29-002',
  textHash: '1a51b007ff2d0e',
  verified: {
    source: 'cards/overrides/ST29-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rest',
      label:
        "Rest up to 1 of your opponent's Characters with a cost equal to or less than the number of your opponent's Life cards",
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: { life: 'opponent' } } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: the cost bound is the opponent's Life count as the effect resolves; an already rested Character is a legal (no-op) target",
  ],
};
