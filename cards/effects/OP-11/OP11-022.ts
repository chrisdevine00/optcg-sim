import type { CardScript } from '../../src/dsl.ts';

/** OP11-022 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_022: CardScript = {
  cardId: 'OP11-022',
  textHash: '00a9049eae5481',
  verified: {
    source: 'cards/overrides/OP11-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-attack',
      label: 'This Leader cannot attack',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotAttack',
          },
        },
      ],
    },
    {
      id: 'play',
      label:
        'Once per turn, you may rest 1 DON!! and turn 1 Life card face-up: play up to 1 {Neptunian} Character or [Megalo] with a cost up to your DON!! count from your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
        {
          turnLifeFaceUp: 1,
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
                      any: [
                        {
                          type: 'Neptunian',
                        },
                        {
                          name: 'Megalo',
                        },
                      ],
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
  rulings: [
    'reading: the DON!! count is read when the play resolves, after one DON!! was rested (it still counts: rested DON!! are on the field); the Character filter is cost <= DON!! on your field (cost area plus given)',
    'reading: "turn 1 card from the top of your Life cards face-up" is the top Life card (the engine cost turnLifeFaceUp)',
  ],
};
