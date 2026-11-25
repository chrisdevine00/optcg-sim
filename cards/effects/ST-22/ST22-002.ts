import type { CardScript } from '../../src/dsl.ts';

/** ST22-002 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_002: CardScript = {
  cardId: 'ST22-002',
  textHash: '00c273e1ab0a9d',
  verified: {
    source: 'cards/overrides/ST22-002.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 {Whitebeard Pirates} card other than [Izo] and add it to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        typeIncludes: 'Whitebeard Pirates',
                      },
                      {
                        not: {
                          name: 'Izo',
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        'You may trash this Character: draw 1 card and place 1 card from your hand at the bottom of your deck',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                pick: {
                  exactly: 1,
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
  rulings: [
    'reading: "a type including" is a substring of a type element (typeIncludes); [Izo] is excluded by name, so another {Whitebeard Pirates} Izo-named card is excluded too',
    'reading: "place 1 card from your hand at the bottom" is mandatory after the draw (the card drawn may be placed back)',
  ],
};
