import type { CardScript } from '../../src/dsl.ts';

/** OP16-058 The Prisoners Are Rioting!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_058: CardScript = {
  cardId: 'OP16-058',
  textHash: '0220ba5c3ad109',
  verified: {
    source: 'cards/overrides/OP16-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If you have 10 DON!!, all your [Prisoner of Impel Down] have base power 7000 this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              10,
            ],
          },
          then: [
            {
              do: {
                setBasePower: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      name: 'Prisoner of Impel Down',
                    },
                  },
                  value: 7000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your [Buggy] gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Buggy',
                },
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
};
