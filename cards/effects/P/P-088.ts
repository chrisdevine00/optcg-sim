import type { CardScript } from '../../src/dsl.ts';

/** P-088 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const P_088: CardScript = {
  cardId: 'P-088',
  textHash: '03a9f3572d8e2b',
  verified: {
    source: 'cards/overrides/P-088.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'With a {Supernovas} Leader and 5 or less total Life, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Supernovas',
                },
              },
              {
                cmp: [
                  {
                    life: 'both',
                  },
                  '<=',
                  5,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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
