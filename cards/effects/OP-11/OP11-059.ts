import type { CardScript } from '../../src/dsl.ts';

/** OP11-059 Gum-Gum King Cobra. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_059: CardScript = {
  cardId: 'OP11-059',
  textHash: '0f82939599a61d',
  verified: {
    source: 'cards/overrides/OP11-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Your Leader or Character gains +2000 power during this battle; then with 4 or less cards in hand, that card gains an additional +2000',
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
                bind: 'buffed',
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              4,
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
                      ref: 'buffed',
                    },
                  },
                  amount: 2000,
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
      label: "Return up to 1 Character with a cost of 2 or less to the owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 2,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (as EB03-020): "that card" is the card chosen for the first boost, so no card chosen means no second boost; the hand is counted after this Event has left it (it is in the trash while it resolves), so 4 or less means 4 or less other cards',
  ],
};
