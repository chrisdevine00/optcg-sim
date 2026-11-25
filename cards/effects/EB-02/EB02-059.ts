import type { CardScript } from '../../src/dsl.ts';

/** EB02-059 Without Your Help I Can't Become the King of the Pirates!!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_059: CardScript = {
  cardId: 'EB02-059',
  textHash: '186d5a3499e8d7',
  verified: {
    source: 'cards/overrides/EB02-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +1000 power during this battle; then, with 1 or less Life, play a yellow {Straw Hat Crew} Character or [Sanji] with a cost of 5 or less from your hand',
      kind: 'activate',
      when: 'counter',
      effect: [
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
              amount: 1000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              1,
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
                          cost: {
                            lte: 5,
                          },
                        },
                        {
                          any: [
                            {
                              all: [
                                {
                                  color: 'Yellow',
                                },
                                {
                                  type: 'Straw Hat Crew',
                                },
                              ],
                            },
                            {
                              name: 'Sanji',
                            },
                          ],
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
    'Read: "yellow" qualifies the {Straw Hat Crew} Characters only; any Character named [Sanji] (of cost 5 or less) is allowed whatever its color',
    'Read: "Then, if ..." is an effect condition read after the power resolves; the Life count is the count then (the Event itself is not a Life card); the play does not depend on the power being given',
  ],
};
