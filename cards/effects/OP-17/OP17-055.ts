import type { CardScript } from '../../src/dsl.ts';

/** OP17-055 There's No Authority in the World That Lasts Forever!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_055: CardScript = {
  cardId: 'OP17-055',
  textHash: '17b385f6952fc6',
  verified: {
    source: 'cards/overrides/OP17-055.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      costOptional: true,
      label: 'Up to 1 of your [Rocks.D.Xebec] gains [Unblockable]',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Rocks.D.Xebec',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your "Rocks Pirates" Leader or Characters gains +2000 power',
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
                  typeIncludes: 'Rocks Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
