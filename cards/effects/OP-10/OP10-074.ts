import type { CardScript } from '../../src/dsl.ts';

/** OP10-074 Pica. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_074: CardScript = {
  cardId: 'OP10-074',
  textHash: '1f503079523778',
  verified: {
    source: 'cards/overrides/OP10-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: if this Character would be K.O.'d by your opponent's effect, you may rest 2 of your active DON!! cards instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          restDon: 2,
        },
      ],
    },
  ],
};
