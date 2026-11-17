import type { CardScript } from '../../src/dsl.ts';

/** ST17-004 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST17_004: CardScript = {
  cardId: 'ST17-004',
  textHash: '195470caa45e20',
  verified: {
    source: 'cards/overrides/ST17-004.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3, place them at the top or bottom in any order; give up to 1 rested DON!! to a Warlord Leader or Character',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'The Seven Warlords of the Sea',
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
  rulings: [
    'QA-OP17 OP17-050 (same wording): all looked-at cards go to the top or all to the bottom',
    'The DON!! is given even if the Leader is the only candidate',
  ],
};
