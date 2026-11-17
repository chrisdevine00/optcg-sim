import type { CardScript } from '../../src/dsl.ts';

/** OP10-114 X.Drake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_114: CardScript = {
  cardId: 'OP10-114',
  textHash: '1888683705196e',
  verified: {
    source: 'cards/overrides/OP10-114.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'rest-opp',
      label:
        "You may rest this Character: if your Life is not above your opponent's, rest up to 1 of their Characters with a cost of 4 or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              {
                life: 'opponent',
              },
            ],
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 4,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'The Life comparison is after the colon, so the rest cost is paid even if the comparison then fails',
  ],
};
