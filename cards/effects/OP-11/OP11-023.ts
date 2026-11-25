import type { CardScript } from '../../src/dsl.ts';

/** OP11-023 Arlong. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_023: CardScript = {
  cardId: 'OP11-023',
  textHash: '051cef18b3f894',
  verified: {
    source: 'cards/overrides/OP11-023.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'cheaper',
      label:
        'In hand: -3 cost if your Leader has the {Fish-Man} type, you have 3 or less Life cards and your opponent has 5 or more rested cards',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        { leader: { type: 'Fish-Man' } },
        { cmp: [{ life: 'you' }, '<=', 3] },
        {
          cmp: [
            {
              sum: [
                { count: { from: 'field', owner: 'opponent', filter: { state: 'rested' } } },
                { donOnField: 'opponent', state: 'rested' },
              ],
            },
            '>=',
            5,
          ],
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q25 reading (as OP12-118): "rested cards" are the opponent\'s rested Leader, Characters and Stage plus their rested DON!! in the cost area',
    'reading: the quoted {Fish-Man} is the exact type of your Leader; Life 3 is in, 4 is out; the discount is live while the card is in your hand and is gone once it is played',
  ],
};
