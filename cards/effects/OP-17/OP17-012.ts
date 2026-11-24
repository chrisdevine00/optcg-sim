import type { CardScript } from '../../src/dsl.ts';

/** OP17-012 Blenheim. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_012: CardScript = {
  cardId: 'OP17-012',
  textHash: '03123f5c204953',
  verified: {
    source: 'cards/overrides/OP17-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'Play up to 1 card with a cost of 1 and a type including "Whitebeard Pirates" from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      cost: {
                        eq: 1,
                      },
                    },
                    {
                      typeIncludes: 'Whitebeard Pirates',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
