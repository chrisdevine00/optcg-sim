import type { CardScript } from '../../src/dsl.ts';

/** OP11-021 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_021: CardScript = {
  cardId: 'OP11-021',
  textHash: '02d545ced728d7',
  verified: {
    source: 'cards/overrides/OP11-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end',
      label:
        'With 6 or less cards in hand, set up to 1 {Fish-Man} or {Merfolk} Character and up to 1 DON!! card as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      conditions: [
        {
          cmp: [
            {
              hand: 'you',
            },
            '<=',
            6,
          ],
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                any: [
                  {
                    type: 'Fish-Man',
                  },
                  {
                    type: 'Merfolk',
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the two sets are independent steps (the hand size is checked once, when the ability triggers); "up to 1 DON!! card" is picked from the cost area, as OP14-039',
  ],
};
