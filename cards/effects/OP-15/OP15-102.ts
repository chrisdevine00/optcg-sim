import type { CardScript } from '../../src/dsl.ts';

/** OP15-102 Gan.Fall. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_102: CardScript = {
  cardId: 'OP15-102',
  textHash: '11f4143e7d6d94',
  verified: {
    source: 'cards/overrides/OP15-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -3 cost while you have a {Sky Island} Character with 7000 power or more',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: { all: [{ type: 'Sky Island' }, { power: { gte: 7000 } }] },
          },
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
    },
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters with a cost equal to or less than the number of your opponent's Life cards",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: { life: 'opponent' } } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'OPEN-QUESTIONS Q2 / textFixes: the sign was missing in the source text; verified as -3 cost (the data fix)',
  ],
};
