import type { CardScript } from '../../src/dsl.ts';

/** OP14-096 Ground Death. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_096: CardScript = {
  cardId: 'OP14-096',
  textHash: '17532bba94c0da',
  verified: {
    source: 'cards/overrides/OP14-096.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest 2 DON!!: negate the effect of up to 1 of your opponent's cost 5 or less Characters",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
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
    {
      id: 'counter',
      label: 'With 10 or more cards in your trash, +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
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
  ],
  rulings: [
    'M4a-08 / DECISIONS 2026-11-09 B-1: the "You may rest" cost on an Event [Main] is asked and may be declined',
  ],
};
