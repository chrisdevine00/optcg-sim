import type { CardScript } from '../../src/dsl.ts';

/** ST16-003 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST16_003: CardScript = {
  cardId: 'ST16-003',
  textHash: '02397dcc4d2911',
  verified: {
    source: 'cards/overrides/ST16-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label: 'If your Leader has the "FILM" type and you have 6 or more rested cards, +2000 power',
      kind: 'permanent',
      conditions: [
        { leader: { type: 'FILM' } },
        {
          cmp: [
            {
              sum: [
                { count: { from: 'field', owner: 'you', filter: { state: 'rested' } } },
                { donOnField: 'you', state: 'rested' },
              ],
            },
            '>=',
            6,
          ],
        },
      ],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 2000 } }],
    },
  ],
  rulings: [
    'M6b-Q25: "rested cards" = rested Leader, Characters and Stage plus rested DON!! in the cost area (the OP12-118 reading); this Character counts itself when rested',
  ],
};
