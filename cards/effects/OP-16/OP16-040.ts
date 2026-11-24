import type { CardScript } from '../../src/dsl.ts';

/** OP16-040 Gum-Gum Hammer Rifle. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_040: CardScript = {
  cardId: 'OP16-040',
  textHash: '1e5f08ef451fa4',
  verified: {
    source: 'cards/overrides/OP16-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If you have [Monkey.D.Luffy] and [Mr.3(Galdino)], up to 1 of your opponent's rested Characters with a cost of 6 or less will not become active in the next Refresh Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            all: [
              {
                exists: {
                  from: ['leader', 'characters'],
                  owner: 'you',
                  filter: {
                    name: 'Monkey.D.Luffy',
                  },
                },
              },
              {
                exists: {
                  from: ['leader', 'characters'],
                  owner: 'you',
                  filter: {
                    name: 'Mr.3(Galdino)',
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                skipRefresh: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    all: [
                      {
                        state: 'rested',
                      },
                      {
                        cost: {
                          lte: 6,
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
};
