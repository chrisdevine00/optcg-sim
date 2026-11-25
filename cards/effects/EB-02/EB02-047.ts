import type { CardScript } from '../../src/dsl.ts';

/** EB02-047 Blueno. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_047: CardScript = {
  cardId: 'EB02-047',
  textHash: '1e674ae2a666f1',
  verified: {
    source: 'cards/overrides/EB02-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may trash 1 card from your hand and trash this Character: play up to 1 Character with a type including "CP" and a cost of 5 or less other than [Blueno] from your trash',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      typeIncludes: 'CP',
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                    {
                      not: {
                        name: 'Blueno',
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
        },
      ],
    },
  ],
  rulings: [
    'Read: Blueno is in the trash when the play resolves, and "other than [Blueno]" excludes every card named Blueno; the cost is paid even if the trash holds no match',
  ],
};
