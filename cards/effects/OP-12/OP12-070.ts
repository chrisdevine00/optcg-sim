import type { CardScript } from '../../src/dsl.ts';

/** OP12-070 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_070: CardScript = {
  cardId: 'OP12-070',
  textHash: '0e1a5d9c887d08',
  verified: {
    source: 'cards/overrides/OP12-070.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label: 'This Character gains +1000 power for every 5 Events in your trash',
      kind: 'permanent',
      apply: [
        {
          power: {
            target: { from: 'self', owner: 'you' },
            amount: {
              mul: [
                {
                  div: [
                    { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
                    5,
                  ],
                },
                1000,
              ],
            },
          },
        },
      ],
    },
    {
      id: 'shield',
      label:
        "If this Character would be removed from the field by your opponent's effect, you may return 1 DON!! card from your field to your DON!! deck instead",
      kind: 'replacement',
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ returnDon: 1 }],
    },
  ],
  rulings: [
    'Reading: the boost steps by 1000 at 5, 10, 15 Events (floor of Events / 5); the replacement is not Once Per Turn and not gated on whose turn it is',
  ],
};
