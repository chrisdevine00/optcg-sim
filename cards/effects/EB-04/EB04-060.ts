import type { CardScript } from '../../src/dsl.ts';

/** EB04-060 Gum-Gum Hawk Gatling. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_060: CardScript = {
  cardId: 'EB04-060',
  textHash: '0fed4cb6a90bde',
  verified: {
    source: 'cards/overrides/EB04-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Add 1 Life card to hand: add up to 1 {Egghead} Character from hand to the top of Life face-up, then up to 1 opposing Character -1000 power',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Egghead',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
                faceUp: true,
              },
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
