import type { CardScript } from '../../src/dsl.ts';

/** OP15-037 The Outcome Will Tell Us Who's Strong and Who's Weak. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_037: CardScript = {
  cardId: 'OP15-037',
  textHash: '17cc6e6f4228a5',
  verified: {
    source: 'cards/overrides/OP15-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5 cards; reveal up to 1 East Blue card other than this one and add it to your hand; the rest to the bottom',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: {
                    all: [
                      { type: 'East Blue' },
                      { not: { name: "The Outcome Will Tell Us Who's Strong and Who's Weak" } },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    { id: 'trigger', label: 'Draw 1 card', kind: 'trigger', effect: [{ do: { draw: 1 } }] },
  ],
};
