import type { CardScript } from '../../src/dsl.ts';

/** EB04-028 Ice Time. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_028: CardScript = {
  cardId: 'EB04-028',
  textHash: '0089f0a9d1378a',
  verified: {
    source: 'cards/overrides/EB04-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Trash 1 card: with a {Navy} Leader, up to 2 opposing Characters with 10000 power or less cannot attack',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      power: {
                        lte: 10000,
                      },
                    },
                    pick: {
                      upTo: 2,
                    },
                  },
                  what: 'cannotAttack',
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 5 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
};
