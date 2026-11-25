import type { CardScript } from '../../src/dsl.ts';

/** OP10-053 Bian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_053: CardScript = {
  cardId: 'OP10-053',
  textHash: '117a00320ae8fa',
  verified: {
    source: 'cards/overrides/OP10-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With a {The Tontattas} Character other than [Bian], this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'The Tontattas',
                },
                {
                  not: {
                    name: 'Bian',
                  },
                },
              ],
            },
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [Blocker] is gained, not printed, so keywords stays empty; "other than [Bian]" is by name',
  ],
};
