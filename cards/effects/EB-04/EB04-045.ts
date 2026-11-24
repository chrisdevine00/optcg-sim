import type { CardScript } from '../../src/dsl.ts';

/** EB04-045 Ginny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_045: CardScript = {
  cardId: 'EB04-045',
  textHash: '0d6dd7b88e8945',
  verified: {
    source: 'cards/overrides/EB04-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character: with 2 or more Characters with cost 8 or more, a {Revolutionary Army} Leader or Character gains +1000 power',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'any',
                  filter: {
                    cost: {
                      gte: 8,
                    },
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: {
                      type: 'Revolutionary Army',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
