import type { CardScript } from '../../src/dsl.ts';

/** OP15-012 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_012: CardScript = {
  cardId: 'OP15-012',
  textHash: '133386d952b20c',
  verified: {
    source: 'cards/overrides/OP15-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "Give up to 1 of your opponent's rested DON!! to their Leader or 1 of their Characters",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              from: 'opponent',
              to: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: ["reading (M6b-Q24): as OP15-010, the DON!! is the opponent's own rested one"],
};
