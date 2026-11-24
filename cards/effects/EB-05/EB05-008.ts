import type { CardScript } from '../../src/dsl.ts';

/** EB05-008 Luffy, Now's Your Chance. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_008: CardScript = {
  cardId: 'EB05-008',
  textHash: '15bdbf443a0e2b',
  verified: {
    source: 'cards/overrides/EB05-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may give 1 active DON!! to your Leader and reveal 2 red Events: give up to 1 of your opponent's rested Characters -7000 power during this turn",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'active',
            to: {
              from: 'leader',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  color: 'Red',
                },
                {
                  category: ['Event'],
                },
              ],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  state: 'rested',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: -7000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'If you have no Characters with a cost of 5 or more, up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                cost: {
                  gte: 5,
                },
              },
            },
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
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'DECISIONS 2026-11-09 B-1: an Event worded "You may <cost>:" asks the cost after the card is played and it may be declined',
    'reading: "1 of your Leader" is the Leader; the DON!! is given from the cost area (active) and stays on the Leader',
    'reading: the [Counter] condition is checked as the effect resolves; with a Character of cost 5 or more the Counter is played and does nothing',
  ],
};
