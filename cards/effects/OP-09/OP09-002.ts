import type { CardScript } from '../../src/dsl.ts';

/** OP09-002 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_002: CardScript = {
  cardId: 'OP09-002',
  textHash: '1e75c7fe4cc8d0',
  verified: {
    source: 'cards/overrides/OP09-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; add up to 1 {Red-Haired Pirates} card to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Red-Haired Pirates',
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
  ],
  rulings: [
    'CR 8-4-4-2: a search may take nothing even with a match in the 5 cards; the quoted type is the exact type {Red-Haired Pirates}',
  ],
};
