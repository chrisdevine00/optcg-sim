import type { CardScript } from '../../src/dsl.ts';

/** OP13-005 Inazuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_005: CardScript = {
  cardId: 'OP13-005',
  textHash: '1f713722a4534b',
  verified: {
    source: 'cards/overrides/OP13-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 1 rested DON!! to your Leader',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
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
