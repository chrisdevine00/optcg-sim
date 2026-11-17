import type { CardScript } from '../../src/dsl.ts';

/** OP14-118 You'll Frighten Me... ♡. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_118: CardScript = {
  cardId: 'OP14-118',
  textHash: '0b8ef0a9865113',
  verified: {
    source: 'cards/overrides/OP14-118.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "With 2 or less Life, up to 1 of your opponent's active Characters cannot attack this turn",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      state: 'active',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  what: 'cannotAttack',
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
      label: 'Play up to 1 Character card with 6000 power or less and a [Trigger] from your hand',
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
                      power: {
                        lte: 6000,
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
};
