import type { CardScript } from '../../src/dsl.ts';

/** EB05-001 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_001: CardScript = {
  cardId: 'EB05-001',
  textHash: '08c42b0a9e13c2',
  verified: {
    source: 'cards/overrides/EB05-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Supernovas} type: draw 2, play up to 2 Characters with 2000 power or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Supernovas',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
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
                          power: {
                            lte: 2000,
                          },
                        },
                      ],
                    },
                    pick: {
                      upTo: 2,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'debuff',
      label:
        "Give up to 1 of your opponent's Leader or Characters with 6000 power or more -1000 power until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                filter: {
                  power: {
                    gte: 6000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "If your Leader has the {Supernovas} type" is checked when the [On Play] resolves (an `if` step); "draw 2 cards and play" is one sentence, so both happen only when the condition holds',
    'reading: the power filter (6000 or more) reads current power when the target is chosen',
  ],
};
