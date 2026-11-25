import type { CardScript } from '../../src/dsl.ts';

/** OP10-097 Gum-Gum Rhino Schneider. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_097: CardScript = {
  cardId: 'OP10-097',
  textHash: '0114361acea93e',
  verified: {
    source: 'cards/overrides/OP10-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Up to 1 of your {Dressrosa} Characters gains +2000 power during this turn; then, if you have 10 or more cards in your trash, that card gains [Banish] during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Dressrosa',
                },
                pick: {
                  upTo: 1,
                },
                bind: 'buffed',
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                trash: 'you',
              },
              '>=',
              10,
            ],
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      ref: 'buffed',
                    },
                  },
                  keyword: 'Banish',
                  duration: 'thisTurn',
                },
              },
            },
          ],
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
  rulings: [
    'reading: this Event is already in the trash when it resolves, so it counts toward the 10; "that card" is the Character chosen for the +2000 (nothing is granted if none was chosen)',
  ],
};
