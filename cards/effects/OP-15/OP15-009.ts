import type { CardScript } from '../../src/dsl.ts';

/** OP15-009 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_009: CardScript = {
  cardId: 'OP15-009',
  textHash: '0e8a891f647619',
  verified: {
    source: 'cards/overrides/OP15-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label: 'Give your Leader -2000 power instead',
      kind: 'replacement',
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { basePower: { lte: 7000 } } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: as OP15-035 Laboon, Koby may protect himself (7000 base or less); "removed from the field" is any removal by the opponent\'s effects (K.O., return to hand, trash); the Leader is given -2000 even if its power goes to 0 or below',
  ],
};
