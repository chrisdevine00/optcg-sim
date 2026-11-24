import type { CardScript } from '../../src/dsl.ts';

/** OP12-094 Monkey.D.Dragon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_094: CardScript = {
  cardId: 'OP12-094',
  textHash: '0275ce3db50faa',
  verified: {
    source: 'cards/overrides/OP12-094.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may place 3 Revolutionary Army cards from your trash at the bottom of your deck: with a Revolutionary Army Leader, play up to 1 Character with cost 6 or less from your trash',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            filter: {
              type: 'Revolutionary Army',
            },
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
          if: {
            leader: {
              type: 'Revolutionary Army',
            },
          },
          then: [
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
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the cost cards leave the trash first, so they cannot be the Character played; "If your Leader" after the colon is checked when the effect resolves, the cost is paid either way',
  ],
};
