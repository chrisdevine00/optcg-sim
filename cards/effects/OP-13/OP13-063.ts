import type { CardScript } from '../../src/dsl.ts';

/** OP13-063 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_063: CardScript = {
  cardId: 'OP13-063',
  textHash: '1ac55cfb1900e9',
  verified: {
    source: 'cards/overrides/OP13-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'With any DON!! given: add up to 1 DON!! rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donGiven: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['reading: "add up to 1 DON!!" asks a count (0 or 1), as every up-to DON!! add'],
};
