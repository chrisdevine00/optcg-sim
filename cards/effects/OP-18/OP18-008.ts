import type { CardScript } from '../../src/dsl.ts';

/** OP18-008 Chaka. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_008: CardScript = {
  cardId: 'OP18-008',
  textHash: '05ce6a8d43fa8e',
  verified: {
    source: 'cards/overrides/OP18-008.json (official OP-18 card list, card text in cards/data)',
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
        'You may trash 1 Character with 5000 power or less from your hand: draw 2 cards and gain [Banish] this turn',
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
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Banish',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
