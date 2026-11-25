import type { CardScript } from '../../src/dsl.ts';

/** ST25-002 Cabaji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST25_002: CardScript = {
  cardId: 'ST25-002',
  textHash: '0baac9f211b701',
  verified: {
    source: 'cards/overrides/ST25-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-and-cost',
      label:
        'With 2 or more Characters with a base cost of 5 or more, this Character gains [Blocker] and +1 cost',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'characters', owner: 'you', filter: { baseCost: { gte: 5 } } } },
            '>=',
            2,
          ],
        },
      ],
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        { cost: { target: { from: 'self', owner: 'you' }, amount: 1 } },
      ],
    },
    {
      id: 'opp-turn-power',
      label: "[Opponent's Turn] +5000 power",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 5000 } }],
    },
  ],
  rulings: [
    'Reading: Cabaji is base cost 4 and never counts toward her own condition; base cost is the printed cost (the +1 does not feed it); [Blocker] is gained, not printed, so keywords stays empty',
  ],
};
