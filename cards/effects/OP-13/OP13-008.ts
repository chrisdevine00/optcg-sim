import type { CardScript } from '../../src/dsl.ts';

/** OP13-008 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_008: CardScript = {
  cardId: 'OP13-008',
  textHash: '0a99c015123f5d',
  verified: {
    source: 'cards/overrides/OP13-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Instead of your Revolutionary Army Character being K.O.'d by the opponent's effect, trash this Character",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Revolutionary Army',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          trashSelf: true,
        },
      ],
    },
  ],
};
