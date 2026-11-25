import type { CardScript } from '../../src/dsl.ts';

/** OP09-051 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_051: CardScript = {
  cardId: 'OP09-051',
  textHash: '0138c683a4ebc5',
  verified: {
    source: 'cards/overrides/OP09-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Place up to 1 of your opponent's Characters at the bottom of the owner's deck; then, if you do not have 5 Characters with a cost of 5 or more, place this Character at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    cost: {
                      gte: 5,
                    },
                  },
                },
              },
              '<',
              5,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      isSelf: true,
                    },
                  },
                  to: {
                    zone: 'deck',
                    position: 'bottom',
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
    'reading: "Then, if" is its own condition, not "if you do": it is checked whether or not an opposing Character was placed; Buggy (cost 10) counts himself among the 5, and the count uses current cost, your Characters only; the placement of this Character is a `move` of the `isSelf` Character (`move` from `self` is not supported by the engine, see the report)',
  ],
};
