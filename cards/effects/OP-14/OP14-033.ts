import type { CardScript } from '../../src/dsl.ts';

/** OP14-033 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_033: CardScript = {
  cardId: 'OP14-033',
  textHash: '080eeeec27d059',
  verified: {
    source: 'cards/overrides/OP14-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 2 of the opponent's Characters with a cost of 5 or less cannot be rested until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
                pick: {
                  upTo: 2,
                },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'You may rest 1 of your cards: play up to 1 green Character with a cost of 5 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
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
                      color: 'Green',
                    },
                    {
                      cost: {
                        lte: 5,
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
  rulings: [
    'reading: "cannot be rested" (G2) also stops attacking and [Blocker]; "your cards" for the cost are Leader, Characters, Stage and active DON!!; the played card is ungated on the hand (leak rule)',
  ],
};
