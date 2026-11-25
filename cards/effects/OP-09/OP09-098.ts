import type { CardScript } from '../../src/dsl.ts';

/** OP09-098 Black Hole. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_098: CardScript = {
  cardId: 'OP09-098',
  textHash: '1a28e15b021a39',
  verified: {
    source: 'cards/overrides/OP09-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] With a Blackbeard Pirates Leader, negate up to 1 of your opponent's Characters this turn; then, if it has a cost of 4 or less, K.O. it",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              do: {
                negate: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                    bind: 't',
                  },
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    all: [
                      {
                        ref: 't',
                      },
                      {
                        cost: {
                          lte: 4,
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Negate the effect of up to 1 of your opponent's Leader or Character cards this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            negate: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "that Character" is the one chosen for the negate; its cost is read after the negate (a cost bonus from its own effect is gone); the whole effect needs the Blackbeard Pirates Leader (the "Then" is inside the "If")',
  ],
};
