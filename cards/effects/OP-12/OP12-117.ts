import type { CardScript } from '../../src/dsl.ts';

/** OP12-117 Slam Gibson. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_117: CardScript = {
  cardId: 'OP12-117',
  textHash: '00a473e166052d',
  verified: {
    source: 'cards/overrides/OP12-117.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 5 DON!!: if your Leader has the "Supernovas" type, add up to 1 Character with a cost of 9 or less to the top or bottom of its owner\'s Life cards face-down',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 5,
        },
      ],
      costOptional: true,
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
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: {
                      cost: {
                        lte: 9,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'topOrBottom',
                    faceUp: false,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon, so it is an effect condition: with the cost paid and the Leader not "Supernovas", the Event resolves and nothing happens',
    'reading (G61, M6b-Q78): "a cost of 9 or less" is the current cost, either player\'s Character; the card goes to its owner\'s Life face-down, at the end its controller chooses; replacements and protections from removal apply',
    'reading: the "Supernovas" type is the exact type (optcgapi prints the official {Supernovas} as "Supernovas"), not a substring',
  ],
};
