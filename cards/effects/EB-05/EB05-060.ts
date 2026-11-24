import type { CardScript } from '../../src/dsl.ts';

/** EB05-060 Take Care of Lilith!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_060: CardScript = {
  cardId: 'EB05-060',
  textHash: '0006ca65cdb35e',
  verified: {
    source: 'cards/overrides/EB05-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Trash 1 of your {Egghead} Characters with a cost of 5 or more: add up to 1 card from the top of your deck to the top of your Life',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          trash: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'Egghead',
                },
                {
                  cost: {
                    gte: 5,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'Turn 1 card from the top of your Life face-up: up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          turnLifeFaceUp: 1,
        },
      ],
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
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: ['RL-15: trashing is not a K.O.'],
};
