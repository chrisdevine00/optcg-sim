import type { CardScript } from '../../src/dsl.ts';

/** OP11-065 Charlotte Anana. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_065: CardScript = {
  cardId: 'OP11-065',
  textHash: '09fb73a74247a6',
  verified: {
    source: 'cards/overrides/OP11-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        'With another purple {Big Mom Pirates} Character not named [Charlotte Anana], this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  color: 'Purple',
                },
                {
                  type: 'Big Mom Pirates',
                },
                {
                  not: {
                    name: 'Charlotte Anana',
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
    'reading: "other than [Charlotte Anana]" excludes every Character named [Charlotte Anana] (a second copy does not count), not just this card',
  ],
};
