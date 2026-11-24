import type { CardScript } from '../../src/dsl.ts';

/** ST30-016 Can You Still Fight, Luffy?! Of Course!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_016: CardScript = {
  cardId: 'ST30-016',
  textHash: '17d22cf0d606d0',
  verified: {
    source: 'cards/overrides/ST30-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +3000 power during this battle. Then, if you have [Portgas.D.Ace] and [Monkey.D.Luffy] Characters with 6000 base power, draw 1 card',
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
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            all: [
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    all: [
                      {
                        name: 'Portgas.D.Ace',
                      },
                      {
                        basePower: {
                          eq: 6000,
                        },
                      },
                    ],
                  },
                },
              },
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    all: [
                      {
                        name: 'Monkey.D.Luffy',
                      },
                      {
                        basePower: {
                          eq: 6000,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, if" is an independent step: the draw does not depend on the +3000 having been given ("up to" 0 targets)',
  ],
};
