import type { CardScript } from '../../src/dsl.ts';

/** OP12-115 I Love You!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_115: CardScript = {
  cardId: 'OP12-115',
  textHash: '101a421bfe94fd',
  verified: {
    source: 'cards/overrides/OP12-115.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Your Leader or Character gains +2000 power during this battle; then, with 2 or less Life, add a [Trafalgar Law] from your trash to your hand',
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
              amount: 2000,
              duration: 'battle',
            },
          },
        },
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
                move: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      name: 'Trafalgar Law',
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
    },
  ],
};
