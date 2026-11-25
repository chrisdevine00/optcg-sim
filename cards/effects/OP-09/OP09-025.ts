import type { CardScript } from '../../src/dsl.ts';

/** OP09-025 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_025: CardScript = {
  cardId: 'OP09-025',
  textHash: '072cc788d5b0f5',
  verified: {
    source: 'cards/overrides/OP09-025.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label:
        'If your Leader has the "ODYSSEY" type, this Character cannot be K.O.\'d in battle by Leaders',
      kind: 'permanent',
      conditions: [{ leader: { type: 'ODYSSEY' } }],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'battle', by: { category: ['Leader'] } } },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: only a Leader's battle K.O. is stopped, and only while your Leader has the {ODYSSEY} type (checked live); Characters, effects and a Leader without the type are not stopped; the Character can still be K.O.'d by an effect",
  ],
};
