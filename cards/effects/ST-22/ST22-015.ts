import type { CardScript } from '../../src/dsl.ts';

/** ST22-015 I Am Whitebeard!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_015: CardScript = {
  cardId: 'ST22-015',
  textHash: '0141d09eb38fbe',
  verified: {
    source: 'cards/overrides/ST22-015.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If your Leader\'s type includes "Whitebeard Pirates", play up to 1 [Edward.Newgate] from your hand; then you may add 1 card from the top or bottom of your Life to your hand: your Leader gains +2000 power until the end of your opponent\'s next turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Whitebeard Pirates',
            },
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
                          name: 'Edward.Newgate',
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
            {
              if: {
                cmp: [
                  {
                    life: 'you',
                  },
                  '>=',
                  1,
                ],
              },
              then: [
                {
                  may: [
                    {
                      do: {
                        move: {
                          what: {
                            from: 'lifeTopOrBottom',
                            owner: 'you',
                            pick: {
                              exactly: 1,
                            },
                          },
                          to: {
                            zone: 'hand',
                          },
                        },
                      },
                    },
                  ],
                  label: 'life',
                },
                {
                  ifDid: 'life',
                  then: [
                    {
                      do: {
                        power: {
                          target: {
                            from: 'leader',
                            owner: 'you',
                            pick: {
                              upTo: 1,
                            },
                          },
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
        },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then, you may add ..." follows the "If" sentence, so the whole effect is inside the Leader guard: with a Leader that is not {Whitebeard Pirates} nothing happens at all',
    'reading: the Life step is gated on a public count (1 or more Life cards); the Life card goes to the hand with no [Trigger] (not damage); the end (top or bottom) is a blind choice',
    'reading: the play is "up to 1" and may be declined, and the Life step stays available when nothing was played ("Then" follows the guard, not "If you do")',
  ],
};
