import type { CardScript } from '../../src/dsl.ts';

/** OP15-106 Octoballoon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_106: CardScript = {
  cardId: 'OP15-106',
  textHash: '1d6af9371b3883',
  verified: {
    source: 'cards/overrides/OP15-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'Draw 1 card; then play up to 1 yellow Character or Stage card with a cost of 2 or less from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character', 'Stage'] },
                    { color: 'Yellow' },
                    { cost: { lte: 2 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
