import type { CardScript } from '../../src/dsl.ts';

/** OP18-056 Mr.13 & Ms.Friday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_056: CardScript = {
  cardId: 'OP18-056',
  textHash: '1637491f401e81',
  verified: {
    source: 'cards/overrides/OP18-056.json (official OP-18 card list, card text in cards/data)',
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
        'You may place 1 of your Characters with a type including "Baroque Works" other than this Character at the bottom of your deck: your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: { all: [{ typeIncludes: 'Baroque Works' }, { isSelf: false }] },
            pick: { exactly: 1 },
          },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: { exactly: 1 },
            },
          },
        },
      ],
    },
  ],
};
