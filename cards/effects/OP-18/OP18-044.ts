import type { CardScript } from '../../src/dsl.ts';

/** OP18-044 Mr.Beans & Miss.Katherina. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_044: CardScript = {
  cardId: 'OP18-044',
  textHash: '038ab4022d0121',
  verified: {
    source: 'cards/overrides/OP18-044.json (official OP-18 card list, card text in cards/data)',
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
      label: '[On Play] Draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 1 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
};
