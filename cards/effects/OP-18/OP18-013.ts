import type { CardScript } from '../../src/dsl.ts';

/** OP18-013 Pell. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_013: CardScript = {
  cardId: 'OP18-013',
  textHash: '1f470de846aa5a',
  verified: {
    source: 'cards/overrides/OP18-013.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'rush',
      label: 'If your Leader has the {Alabasta} type, gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Alabasta',
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "You may trash 1 Character with 5000 power or less from your hand: draw 2 cards and trash up to 1 of your opponent's Characters with 3000 base power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    lte: 5000,
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
            draw: 2,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  basePower: {
                    lte: 3000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'trash',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ["reading: the opponent Character is trashed, not K.O.'d (no [On K.O.], as ST19-003)"],
};
