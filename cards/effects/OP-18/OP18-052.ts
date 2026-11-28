import type { CardScript } from '../../src/dsl.ts';

/** OP18-052 Mr.5 & Miss.Valentine. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_052: CardScript = {
  cardId: 'OP18-052',
  textHash: '182ef1cb5ccb0d',
  verified: {
    source: 'cards/overrides/OP18-052.json (official OP-18 card list, card text in cards/data)',
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
        '[On Play] Play up to 1 Character card with a type including "Baroque Works" and a cost of 3 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { typeIncludes: 'Baroque Works' },
                    { cost: { lte: 3 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
