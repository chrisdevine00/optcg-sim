import type { CardScript } from '../../src/dsl.ts';

/** OP18-055 Mr.9 & Ms. Wednesday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_055: CardScript = {
  cardId: 'OP18-055',
  textHash: '178198f8ab26cd',
  verified: {
    source: 'cards/overrides/OP18-055.json (official OP-18 card list, card text in cards/data)',
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
        "[On Play] Return up to 1 of your opponent's Characters with a cost of 2 or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 2 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
};
