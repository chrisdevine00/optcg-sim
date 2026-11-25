import type { CardScript } from '../../src/dsl.ts';

/** ST24-004 Law & Bepo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST24_004: CardScript = {
  cardId: 'ST24-004',
  textHash: '08ed20117c8133',
  verified: {
    source: 'cards/overrides/ST24-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's Characters, which will not become active in their next Refresh Phase; then, if they have 2 or more rested Characters, your Leader gains +2000 power until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              pick: { upTo: 1 },
              bind: 'target',
            },
          },
        },
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: { ref: 'target' },
            },
          },
        },
        {
          if: {
            cmp: [
              {
                count: { from: 'characters', owner: 'opponent', filter: { state: 'rested' } },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: { from: 'leader', owner: 'you' },
                  amount: 2000,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "that Character will not become active" applies to the Character chosen for the rest (an already rested one may be chosen: it stays rested through the next Refresh Phase); with none chosen nothing is skipped',
    'reading: the second sentence is "Then, if ...": an effect condition read after the rest, counting rested opposing Characters (the one just rested included, rested Characters of any origin); the Leader bonus lasts until the end of the opponent\'s next End Phase',
  ],
};
