import type { CardScript } from '../../src/dsl.ts';

/** OP18-001 Karoo (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_001: CardScript = {
  cardId: 'OP18-001',
  textHash: '102cf50e9fe50b',
  verified: {
    source: 'cards/overrides/OP18-001.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'both-types',
      label: 'Your {Animal} and {Alabasta} Characters gain [Rush] and +1000 power',
      kind: 'permanent',
      apply: [
        {
          grant: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Animal',
                  },
                  {
                    type: 'Alabasta',
                  },
                ],
              },
            },
            keyword: 'Rush',
          },
        },
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Animal',
                  },
                  {
                    type: 'Alabasta',
                  },
                ],
              },
            },
            amount: 1000,
          },
        },
      ],
    },
    {
      id: 'draw',
      label: "Once per turn: when your {Alabasta} Character is K.O.'d, draw 1 card",
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'koed',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                type: 'Alabasta',
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader applies to Characters that have both types, itself not included (it is not a Character)',
    "[Once Per Turn] is spent only when a Character of yours with the {Alabasta} type is K.O.'d (any cause, either player's doing)",
  ],
};
