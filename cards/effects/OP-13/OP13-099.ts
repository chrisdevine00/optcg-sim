import type { CardScript } from '../../src/dsl.ts';

/** OP13-099 The Empty Throne. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_099: CardScript = {
  cardId: 'OP13-099',
  textHash: '16cdebd0cb8ac3',
  verified: {
    source: 'cards/overrides/OP13-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label: 'Your Turn: with 19+ cards in trash, your Leader gains +1000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            19,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'leader',
              owner: 'you',
            },
            amount: 1000,
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        'Rest this card and 3 DON!!: play up to 1 black {Five Elders} Character with cost <= your DON!! from hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          restDon: 3,
        },
      ],
      effect: [
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
                      color: 'Black',
                    },
                    {
                      type: 'Five Elders',
                    },
                    {
                      cost: {
                        lte: {
                          donOnField: 'you',
                        },
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
};
