import type { CardScript } from '../../src/dsl.ts';

/** OP09-078 Gum-Gum Giant. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_078: CardScript = {
  cardId: 'OP09-078',
  textHash: '0e98818490dc19',
  verified: {
    source: 'cards/overrides/OP09-078.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label: 'DON!! -2, trash 1: +4000 power during this battle (Straw Hat Crew Leader); draw 2',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          donMinus: 2,
        },
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'CR 4-10-1: "Then, draw 2 cards" follows the "If your Leader has the type" clause, so it is inside the condition (no per-card Q&A; reading recorded in docs/research/m4b-wave2/robin-yenel.md)',
  ],
};
