import type { CardScript } from '../../src/dsl.ts';

/** EB05-057 Nojiko. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_057: CardScript = {
  cardId: 'EB05-057',
  textHash: '07fccf9b2bec79',
  verified: {
    source: 'cards/overrides/EB05-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give',
      label:
        'Give up to 1 rested DON!! to 1 of your Leader or Characters with the "Special" or "Wisdom" attribute',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      attribute: 'Special',
                    },
                    {
                      attribute: 'Wisdom',
                    },
                  ],
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
    {
      id: 'trigger',
      label:
        'If you have 2 or less Life cards, play up to 1 Character with 6000 power or less and a [Trigger] from your hand',
      kind: 'trigger',
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
    },
  ],
  rulings: [
    'As OP14-114: "up to 1 rested DON!!" to exactly 1 chosen card (a Leader or Character with the attribute); nothing happens with no rested DON!! or no legal target',
  ],
};
