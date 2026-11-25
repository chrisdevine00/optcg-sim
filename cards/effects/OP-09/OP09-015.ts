import type { CardScript } from '../../src/dsl.ts';

/** OP09-015 Lucky.Roux. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_015: CardScript = {
  cardId: 'OP09-015',
  textHash: '09282552bb1a9e',
  verified: {
    source: 'cards/overrides/OP09-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        "If your Leader has the {Red-Haired Pirates} type, K.O. up to 1 of your opponent's Characters with a base power of 6000 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: {
            leader: {
              type: 'Red-Haired Pirates',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 6000,
                    },
                  },
                  pick: {
                    upTo: 1,
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
