import type { CardScript } from '../../src/dsl.ts';

/** ST21-014 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_014: CardScript = {
  cardId: 'ST21-014',
  textHash: '0f90cbde5fcacb',
  verified: {
    source: 'cards/overrides/ST21-014.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'when-attacking',
      label: 'Give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
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
