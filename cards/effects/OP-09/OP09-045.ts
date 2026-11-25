import type { CardScript } from '../../src/dsl.ts';

/** OP09-045 Cabaji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_045: CardScript = {
  cardId: 'OP09-045',
  textHash: '0dbffa408808cb',
  verified: {
    source: 'cards/overrides/OP09-045.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label:
        "If you have a [Buggy] or [Mohji] Character, this Character cannot be K.O.'d in battle",
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: { any: [{ name: 'Buggy' }, { name: 'Mohji' }] },
          },
        },
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
    'reading: [Buggy] and [Mohji] are exact card names and the Character must be on your field (a Leader named [Buggy] does not count); the protection is live, checked each time, and covers a battle K.O. only (an effect can still K.O. Cabaji)',
  ],
};
