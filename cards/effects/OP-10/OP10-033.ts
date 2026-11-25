import type { CardScript } from '../../src/dsl.ts';

/** OP10-033 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_033: CardScript = {
  cardId: 'OP10-033',
  textHash: '1f2340ac6037e0',
  verified: {
    source: 'cards/overrides/OP10-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested {ODYSSEY} Characters, up to 1 of your opponent's rested DON!! cards will not become active in their next Refresh Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    all: [{ type: 'ODYSSEY' }, { state: 'rested' }],
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                skipRefresh: {
                  from: 'donCostArea',
                  owner: 'opponent',
                  filter: { state: 'rested' },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If you have 2 or more rested ODYSSEY Characters" follows no colon: an effect condition read when the effect resolves; this Character is played active, so it does not count itself',
    "reading (M6b-Q69): the number of rested DON!! is read when the effect resolves (as many as they have, up to 1); that DON!! stays rested through the opponent's next Refresh Phase only",
  ],
};
