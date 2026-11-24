import type { CardScript } from '../../src/dsl.ts';

/** OP16-098 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_098: CardScript = {
  cardId: 'OP16-098',
  textHash: '0103bcb383fd50',
  verified: {
    source: 'cards/overrides/OP16-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 1 and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 1 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
    {
      id: 'swap',
      label: 'Trash this Character: play up to 1 black [Yamato] with a cost of 8 from your trash',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trashSelf: true }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { all: [{ name: 'Yamato' }, { color: 'Black' }, { cost: { eq: 8 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
