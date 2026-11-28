import type { CardScript } from '../../src/dsl.ts';

/** OP18-053 Mr.7 & Miss.Father'sDay. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_053: CardScript = {
  cardId: 'OP18-053',
  textHash: '012dbc3cbd2bda',
  verified: {
    source: 'cards/overrides/OP18-053.json (official OP-18 card list, card text in cards/data)',
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
        '[On Play] Look at 3 cards from the top of your deck, reorganize them in any order and place them at the top or bottom of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { lookAtTop: { n: 3, take: [], rest: 'topOrBottomAnyOrder' } } }],
    },
  ],
  rulings: [
    'reading (as OP17-050, QA-OP17): all 3 cards go to the top or all 3 to the bottom, in the order chosen',
  ],
};
