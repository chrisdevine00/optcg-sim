import type { CardScript } from '../../src/dsl.ts';

/** OP13-050 Boa Sandersonia. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_050: CardScript = {
  cardId: 'OP13-050',
  textHash: '11f19a228b82c4',
  verified: {
    source: 'cards/overrides/OP13-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Boa Hancock], play up to 1 [Boa Hancock] with a cost of 3 or less from your hand',
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
                        { cost: { lte: 3 } },
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
