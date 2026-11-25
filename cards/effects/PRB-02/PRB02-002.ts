import type { CardScript } from '../../src/dsl.ts';

/** PRB02-002 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_002: CardScript = {
  cardId: 'PRB02-002',
  textHash: '1ba1e00b301209',
  verified: {
    source: 'cards/overrides/PRB02-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: instead of this Character being removed from the field by your opponent's effect, you may give it -2000 power this turn",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            power: {
              target: { from: 'self', owner: 'you' },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: "Give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the replacement is not gated on whose turn it is (no timing tag); Once Per Turn is spent when the replacement is used, as for OP13-017',
  ],
};
