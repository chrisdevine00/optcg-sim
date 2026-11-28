import type { CardScript } from '../../src/dsl.ts';

/** OP18-064 Saint Killingham (Purple). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_064: CardScript = {
  cardId: 'OP18-064',
  textHash: '1dce3bf6957d9c',
  verified: {
    source: 'cards/overrides/OP18-064.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! −1: up to 1 of your opponent's Characters with 7000 base power or less and up to 1 with 5000 base power or less cannot attack until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  basePower: {
                    lte: 7000,
                  },
                },
                pick: {
                  upTo: 1,
                },
                bind: 'first',
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  all: [
                    {
                      basePower: {
                        lte: 5000,
                      },
                    },
                    {
                      not: {
                        ref: 'first',
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'DON!! −1: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  isSelf: true,
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'audit Q11 (proposed reading): "up to 1 ... and up to 1 ..." is two picks, the second excluding the card the first chose (`not ref`); the first pick is the 7000-or-less one. A Character chosen for the first pick is never the second, so a lone Character with 5000 or less can fill only one of the two slots',
    "reading: the [Your Turn] is an ability condition on the [On Play] (it is always your turn when you play it from your hand; a play from the trash by the opponent's effect on their turn does nothing); the DON!! −1 cost is optional by construction",
  ],
};
