import type { CardScript } from '../../src/dsl.ts';

/** OP17-045 Kyo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_045: CardScript = {
  cardId: 'OP17-045',
  textHash: '135147efeb23cd',
  verified: {
    source: 'cards/overrides/OP17-045.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'shield',
      label: 'Trash 2 cards from your hand instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: ['QA-OP17 OP17-045: not available with 0 or 1 cards in hand'],
};
