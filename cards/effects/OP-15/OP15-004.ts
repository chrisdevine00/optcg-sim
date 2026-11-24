import type { CardScript } from '../../src/dsl.ts';

/** OP15-004 Sea Cat. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_004: CardScript = {
  cardId: 'OP15-004',
  textHash: '10e092b8a60124',
  verified: {
    source: 'cards/overrides/OP15-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has 0 power or less, give up to 1 opposing Character -3000 power',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ leader: { power: { lte: 0 } } }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "your Leader has 0 power or less" reads the Leader\'s current power (given DON!! and timed modifiers count), checked when the effect resolves',
  ],
};
