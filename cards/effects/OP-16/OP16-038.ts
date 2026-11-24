import type { CardScript } from '../../src/dsl.ts';

/** OP16-038 Let's Go!! To the Navy Headquarters!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_038: CardScript = {
  cardId: 'OP16-038',
  textHash: '1264c374bd3494',
  verified: {
    source: 'cards/overrides/OP16-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 6 DON!!: if you have 5 {Impel Down} Characters with different names, set your Leader and all your Characters active',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 6,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    type: 'Impel Down',
                  },
                },
                distinctNames: true,
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: ['leader', 'characters'],
                  owner: 'you',
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
