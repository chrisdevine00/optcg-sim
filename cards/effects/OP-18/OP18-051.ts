import type { CardScript } from '../../src/dsl.ts';

/** OP18-051 Mr.4 & Miss.MerryChristmas. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_051: CardScript = {
  cardId: 'OP18-051',
  textHash: '0533e368128e02',
  verified: {
    source: 'cards/overrides/OP18-051.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'boost',
      label: '[DON!! x1] This Character gains +1000 power',
      kind: 'permanent',
      conditions: [{ donGiven: 1 }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 1000 } }],
    },
    {
      id: 'on-play',
      label:
        "You may rest 5 of your DON!! cards: place up to 1 Character with a cost of 6 or less and up to 1 Character with a cost of 5 or less at the bottom of the owner's deck in any order of the owner's choosing",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ restDon: 5 }],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'any',
              filter: { cost: { lte: 6 } },
              pick: { upTo: 1 },
              bind: 'a',
            },
          },
        },
        {
          do: {
            select: {
              from: 'characters',
              owner: 'any',
              filter: { all: [{ cost: { lte: 5 } }, { not: { ref: 'a' } }] },
              pick: { upTo: 1 },
              bind: 'b',
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: { any: [{ ref: 'a' }, { ref: 'b' }] },
              },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit Q11): "Character" is either field\'s; the two picks are separate selections (the second excludes the first) and one move places both, so the owner of both is asked the order; the first pick is made before the second (cost 6 or less, then cost 5 or less)',
  ],
};
