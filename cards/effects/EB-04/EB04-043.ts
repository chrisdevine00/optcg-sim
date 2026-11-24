import type { CardScript } from '../../src/dsl.ts';

/** EB04-043 Kaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_043: CardScript = {
  cardId: 'EB04-043',
  textHash: '121b0ded0762d2',
  verified: {
    source: 'cards/overrides/EB04-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: instead of your black Character with a base cost of 5 or less being K.O.'d by an opposing effect, you may place 3 cards from your trash at the bottom of your deck",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            all: [
              {
                color: 'Black',
              },
              {
                baseCost: {
                  lte: 5,
                },
              },
            ],
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
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
    },
    {
      id: 'on-play',
      label: 'Trash 2 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
      ],
    },
  ],
};
