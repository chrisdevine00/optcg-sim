import type { CardScript } from '../../src/dsl.ts';

/** OP12-053 Borsalino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_053: CardScript = {
  cardId: 'OP12-053',
  textHash: '03c76cc510ac5a',
  verified: {
    source: 'cards/overrides/OP12-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once Per Turn: if this Character would be removed from the field by your opponent's effect, you may trash 1 card from your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
    {
      id: 'blocker',
      label:
        "Opponent's Turn: if your Leader has the {Navy} type, this Character gains [Blocker] and +1000 power",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }, { leader: { type: 'Navy' } }],
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        { power: { target: { from: 'self', owner: 'you' }, amount: 1000 } },
      ],
    },
  ],
  rulings: [
    "Reading: the first sentence has no [Opponent's Turn] tag, so the replacement is not gated on whose turn it is (it only ever applies to an opposing effect anyway); only the second sentence is an Opponent's Turn effect",
    'Reading: [Blocker] is gained, not printed, so keywords stays empty',
  ],
};
