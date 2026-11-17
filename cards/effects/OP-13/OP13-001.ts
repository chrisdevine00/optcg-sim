import type { CardScript } from '../../src/dsl.ts';

/** OP13-001 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_001: CardScript = {
  cardId: 'OP13-001',
  textHash: '14e7d773a2622f',
  verified: {
    source: 'cards/overrides/OP13-001.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'opp-attack-boost',
      label: 'Rest any number of DON!!; +2000 power per DON!! rested during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
                state: 'active',
              },
              '<=',
              5,
            ],
          },
          then: [
            {
              may: [
                {
                  do: {
                    rest: {
                      from: 'donCostArea',
                      owner: 'you',
                      pick: {
                        any: true,
                      },
                      bind: 'rested',
                    },
                  },
                },
              ],
              label: 'rest',
            },
            {
              ifDid: 'rest',
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
                        filter: {
                          any: [
                            {
                              isSelf: true,
                            },
                            {
                              all: [
                                {
                                  category: ['Character'],
                                },
                                {
                                  type: 'Straw Hat Crew',
                                },
                              ],
                            },
                          ],
                        },
                      },
                      amount: {
                        mul: [
                          {
                            refCount: 'rested',
                          },
                          2000,
                        ],
                      },
                      duration: 'battle',
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
  rulings: [
    "QA-OP13 OP13-001 (RL-46): the condition and the rest are decided at [On Your Opponent's Attack], before any Counter",
    'reading: one recipient (this Leader or one Character) gets all the power (M4b-wave2 note OP13-001)',
  ],
};
