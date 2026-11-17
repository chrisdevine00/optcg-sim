import type { CardScript } from '../../src/dsl.ts';

/** OP17-086 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_086: CardScript = {
  cardId: 'OP17-086',
  textHash: '04003706b29aa0',
  verified: {
    source: 'cards/overrides/OP17-086.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 {Elbaph} card from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Elbaph',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
  ],
};
