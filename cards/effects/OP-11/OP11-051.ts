import type { CardScript } from '../../src/dsl.ts';

/** OP11-051 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_051: CardScript = {
  cardId: 'OP11-051',
  textHash: '04d0d9b8012db2',
  verified: {
    source: 'cards/overrides/OP11-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-by-effect',
      label:
        "When K.O.'d by your opponent's effect: look at 5; play up to 1 {Straw Hat Crew} Character with cost 5 or less; rest to the bottom",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          koCause: 'opponentEffect',
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        type: 'Straw Hat Crew',
                      },
                      {
                        cost: {
                          lte: 5,
                        },
                      },
                    ],
                  },
                  to: 'play',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: "Return up to 1 Character with 5000 base power or less to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  basePower: {
                    lte: 5000,
                  },
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
  rulings: [
    'reading (as OP16-024): "K.O.\'d by your opponent\'s effect" is an effect of the other player (a cost of theirs included); a battle K.O. or a K.O. by your own effect does not trigger it',
    'reading: the played card is not revealed (the text says play, not reveal); base power is printed power, inclusive at 5000',
  ],
};
