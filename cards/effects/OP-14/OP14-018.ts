import type { CardScript } from '../../src/dsl.ts';

/** OP14-018 Time for the Counterattack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_018: CardScript = {
  cardId: 'OP14-018',
  textHash: '025922c5c0c3f2',
  verified: {
    source: 'cards/overrides/OP14-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If there is a Character with 8000 power or more, up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                power: {
                  gte: 8000,
                },
              },
            },
          },
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
                  },
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play up to 1 red Character with 2000 power or less from your hand',
      kind: 'trigger',
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
                      color: 'Red',
                    },
                    {
                      power: {
                        lte: 2000,
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
    'reading: "a Character" is any Character on either side (current power); the condition is checked as the effect resolves (the Counter is played and does nothing otherwise); the Leader never counts',
  ],
};
