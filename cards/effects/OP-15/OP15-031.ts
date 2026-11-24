import type { CardScript } from '../../src/dsl.ts';

/** OP15-031 Purinpurin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_031: CardScript = {
  cardId: 'OP15-031',
  textHash: '108311585cbdac',
  verified: {
    source: 'cards/overrides/OP15-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Select up to 1 of your opponent's rested Characters; if its cost equals the DON!! given to it, K.O. it",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 1 },
              bind: 'chosen',
            },
          },
        },
        {
          if: {
            cmp: [
              { refStat: 'chosen', stat: 'cost' },
              '=',
              { refStat: 'chosen', stat: 'donGiven' },
            ],
          },
          then: [
            {
              do: {
                ko: { from: 'characters', owner: 'opponent', filter: { ref: 'chosen' } },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading: the cost compared is the current cost (printed plus cost modifiers); a Character with no DON!! given and cost 0 matches (0 = 0); with nothing selected the comparison is false and nothing is K.O.'d",
  ],
};
