import type { CardScript } from '../../src/dsl.ts';

/** OP10-104 Caribou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_104: CardScript = {
  cardId: 'OP10-104',
  textHash: '1a01e125f8a641',
  verified: {
    source: 'cards/overrides/OP10-104.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label:
        "[DON!! x1] If your Leader has the {Supernovas} type and your opponent has 3 or more Life cards, this Character cannot be K.O.'d in battle",
      kind: 'permanent',
      conditions: [
        { donGiven: 1 },
        { leader: { type: 'Supernovas' } },
        { cmp: [{ life: 'opponent' }, '>=', 3] },
      ],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'battle' } },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "Supernovas" is the exact type of your Leader; all three conditions are live (1 DON!! given to Caribou, the Leader type, and the opponent\'s Life count, 3 is in, 2 is out); only a battle K.O. is stopped',
  ],
};
