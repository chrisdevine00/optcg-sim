import type { CardScript } from '../../src/dsl.ts';

/** EB05-059 Charlotte Pudding!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_059: CardScript = {
  cardId: 'EB05-059',
  textHash: '120d2eb10fd41f',
  verified: {
    source: 'cards/overrides/EB05-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Draw 1; your {Big Mom Pirates} Characters with 4000 base power cannot be K.O.'d in battle until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  all: [
                    {
                      basePower: {
                        eq: 4000,
                      },
                    },
                    {
                      type: 'Big Mom Pirates',
                    },
                  ],
                },
              },
              what: {
                cannotBeKOd: {
                  cause: 'battle',
                },
              },
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Draw 1 card and play up to 1 Character with 4000 power and a [Trigger] from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
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
                        eq: 4000,
                      },
                    },
                    {
                      hasTrigger: true,
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
    'RL-14: "cannot be K.O.\'d in battle" does not stop effects',
    'Wave 1 reading (M6b-Q18 family): only Characters on the field when the Event resolves are covered',
  ],
};
