import type { CardScript } from '../../src/dsl.ts';

/** OP15-080 Oars. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_080: CardScript = {
  cardId: 'OP15-080',
  textHash: '0dc0470aa6aa2b',
  verified: {
    source: 'cards/overrides/OP15-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'moria',
      label:
        'If you have [Gecko Moria] with 10000 power or more on your field and there are no other [Oars] cards, this Character gains +7000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: {
              all: [
                {
                  name: 'Gecko Moria',
                },
                {
                  power: {
                    gte: 10000,
                  },
                },
              ],
            },
          },
        },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  name: 'Oars',
                },
                {
                  not: {
                    isSelf: true,
                  },
                },
              ],
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 7000,
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'You may place 3 cards from your trash at the bottom of your deck in any order: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
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
                  isSelf: true,
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
