import type { CardScript } from '../../src/dsl.ts';

/** OP09-031 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_031: CardScript = {
  cardId: 'OP09-031',
  textHash: '02e418fdc6b3f4',
  keywords: ['Blocker'],
  verified: {
    source: 'cards/overrides/OP09-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-turn',
      label: 'If you have 2 or more rested Characters, set this Character as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'self',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If you have 2 or more rested Characters" has no colon, so it is an effect `if` checked when the ability resolves; a rested Doflamingo counts himself',
  ],
};
