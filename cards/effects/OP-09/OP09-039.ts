import type { CardScript } from '../../src/dsl.ts';

/** OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_039: CardScript = {
  cardId: 'OP09-039',
  textHash: '19f5f692e99db6',
  verified: {
    source: 'cards/overrides/OP09-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        '[Counter] With an ODYSSEY Leader and 2 or more rested Characters, up to 1 of your Leader or Character cards gains +2000 power this turn',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'ODYSSEY',
                },
              },
              {
                cmp: [
                  {
                    count: {
                      from: 'characters',
                      owner: 'you',
                      filter: {
                        state: 'rested',
                      },
                    },
                  },
                  '>=',
                  2,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 4,
                    },
                  },
                ],
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
  rulings: [
    'reading: the printed duration is "during this turn" (not "during this battle"), so the +2000 stays after the battle until end of turn; the "If" has no cost colon, so it is an effect condition checked when the Counter resolves (the Counter Event is already trashed and costs are paid either way)',
  ],
};
