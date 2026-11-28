import type { CardScript } from '../../src/dsl.ts';

/** OP18-069 Sodomu & Gomora. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_069: CardScript = {
  cardId: 'OP18-069',
  textHash: '03a8d392e7aaed',
  verified: {
    source: 'cards/overrides/OP18-069.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your {The Franky Family} type Character would be K.O.'d, you may DON!! −1 and rest this Character instead",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'The Franky Family',
          },
        },
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
        {
          restSelf: true,
        },
      ],
    },
  ],
  rulings: [
    'audit Q4 (proposed reading): no "other than this Character", so Sodomu & Gomora covers itself (it is a {The Franky Family} type Character): it may return 1 DON!! and rest itself instead of being K.O.\'d',
    'reading: both halves are paid together or the replacement is not offered: a rested Sodomu & Gomora, or no DON!! on the field, cannot pay; no Once Per Turn; any K.O. cause',
  ],
};
