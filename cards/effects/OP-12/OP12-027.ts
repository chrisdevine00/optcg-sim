import type { CardScript } from '../../src/dsl.ts';

/** OP12-027 Koushirou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_027: CardScript = {
  cardId: 'OP12-027',
  textHash: '1ea78f2ba658b3',
  verified: {
    source: 'cards/overrides/OP12-027.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'shield',
      label:
        "If your <Slash> attribute Character with a cost of 5 or less other than this Character would be K.O.'d by your opponent's effect, you may rest this Character instead",
      kind: 'replacement',
      optional: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: { all: [{ attribute: 'Slash' }, { cost: { lte: 5 } }, { isSelf: false }] },
        },
        cause: 'opponentEffect',
      },
      instead: [{ restSelf: true }],
    },
  ],
  rulings: [
    'reading: Koushirou never protects himself ("other than this Character"); the protected Character\'s cost is its current cost (5 is in, 6 is out); only your opponent\'s effect is covered (not your own effects, not battle); resting him is the cost of the replacement, so it is not offered while he is already rested',
  ],
};
