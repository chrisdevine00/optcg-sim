import type { CardScript } from '../../src/dsl.ts';

/** OP12-048 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_048: CardScript = {
  cardId: 'OP12-048',
  textHash: '0223fe1554646d',
  verified: {
    source: 'cards/overrides/OP12-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Opponent's Turn: if your blue {Navy} Character would be removed from the field by your opponent's effect, you may rest this Character and trash 1 card from your hand instead",
      kind: 'replacement',
      conditions: [{ opponentsTurn: true }],
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: { all: [{ color: 'Blue' }, { type: 'Navy' }] },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        { restSelf: true },
        { trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } },
      ],
    },
  ],
  rulings: [
    'Reading: Rosinante is himself a blue {Navy} Character and may protect himself (he rests as the cost and is not removed); not offered while he is rested, with an empty hand, or on your own turn; every removal by an opposing effect (K.O., bounce, trash) is covered, battle K.O.s and your own effects are not (M6b-Q6 is open for simultaneous removals)',
  ],
};
