import type { CardScript } from '../../src/dsl.ts';

/** EB05-019 I Choose to Open This Country to the World!! I Want to Fight on Your Side!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_019: CardScript = {
  cardId: 'EB05-019',
  textHash: '0786bb1a7f7584',
  verified: {
    source: 'cards/overrides/EB05-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'You may rest 1 of your cards: up to 1 of your {Land of Wano} type Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'Land of Wano',
                },
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
    {
      id: 'trigger',
      label:
        'If your opponent has 3 or less Life cards, play up to 1 {Land of Wano} type Character card with 6000 power or less from your hand',
      kind: 'trigger',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'opponent',
              },
              '<=',
              3,
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          type: 'Land of Wano',
                        },
                        {
                          power: {
                            lte: 6000,
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
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "rest 1 of your cards" is the Leader, a Character, the Stage or an active DON!! (OP15-035 reading, CR 1-3-2-1: only active cards can be rested)',
  ],
};
