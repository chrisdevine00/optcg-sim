import type { CardScript } from '../../src/dsl.ts';

/** OP13-052 Boa Marigold. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_052: CardScript = {
  cardId: 'OP13-052',
  textHash: '1068d20cd27460',
  verified: {
    source: 'cards/overrides/OP13-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Boa Hancock], play up to 1 [Boa Hancock] with a cost of 6 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { name: 'Boa Hancock' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { name: 'Boa Hancock' },
                        { cost: { lte: 6 } },
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
    },
  ],
};
