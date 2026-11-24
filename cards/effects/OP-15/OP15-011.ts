import type { CardScript } from '../../src/dsl.ts';

/** OP15-011 Pearl. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_011: CardScript = {
  cardId: 'OP15-011',
  textHash: '0405535e996048',
  verified: {
    source: 'cards/overrides/OP15-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: "Opponent's turn, East Blue Leader: [Blocker] and +2000 power",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }, { leader: { type: 'East Blue' } }],
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        { power: { target: { from: 'self', owner: 'you' }, amount: 2000 } },
      ],
    },
    {
      id: 'on-ko',
      label:
        'If your Leader has the East Blue type, K.O. up to 1 Character with 6000 base power or less',
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ leader: { type: 'East Blue' } }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { basePower: { lte: 6000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
