import type { CardScript } from '../../src/dsl.ts';

/** OP16-002 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_002: CardScript = {
  cardId: 'OP16-002',
  textHash: '019065ff46dfaa',
  verified: {
    source: 'cards/overrides/OP16-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may reveal 1 Character card with 8000 power from your hand: draw 1',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
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
            draw: 1,
          },
        },
      ],
    },
  ],
};
