import type { CardScript } from '../../src/dsl.ts';

/** OP13-006 Woop Slap. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_006: CardScript = {
  cardId: 'OP13-006',
  textHash: '1481ba0f3dc372',
  verified: {
    source: 'cards/overrides/OP13-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 2 rested DON!! to 1 of your [Monkey.D.Luffy] cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
