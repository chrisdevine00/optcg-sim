import type { CardScript } from '../../src/dsl.ts';

/** OP16-096 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_096: CardScript = {
  cardId: 'OP16-096',
  textHash: '172be620c0a666',
  verified: {
    source: 'cards/overrides/OP16-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Unblockable'],
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 [Yamato] with a cost of 6 or less from your trash',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { all: [{ name: 'Yamato' }, { cost: { lte: 6 } }] },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
