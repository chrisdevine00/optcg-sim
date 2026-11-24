import type { CardScript } from '../../src/dsl.ts';

/** EB03-013. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_013: CardScript = {
  cardId: 'EB03-013',
  textHash: '1b7969b7eaf8de',
  verified: {
    source: 'cards/overrides/EB03-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-play',
      label:
        "Once per turn: if this Character was played this turn, K.O. up to 1 of your opponent's rested Characters with a cost of 5 or less; then play up to 1 [Zou] from your hand",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            self: {
              playedThisTurn: true,
            },
          },
          then: [
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
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      name: 'Zou',
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
    'reading: the "If this Character was played on this turn" has no colon, so it is a step condition: the Once Per Turn is spent even when it is false, and the "Then, play [Zou]" is inside the guard (M4b-5). "Then" is not "If you do": the [Zou] is played with no K.O. target. [Zou] is a Stage; the play ignores the category',
  ],
};
