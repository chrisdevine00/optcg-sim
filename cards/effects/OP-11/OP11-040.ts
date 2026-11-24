import type { CardScript } from '../../src/dsl.ts';

/** OP11-040 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_040: CardScript = {
  cardId: 'OP11-040',
  textHash: '1975b85734ae65',
  verified: {
    source: 'cards/overrides/OP11-040.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'start-of-turn',
      label:
        'At the start of your turn, with 8 or more DON!!: look at 5; reveal up to 1 {Straw Hat Crew} card and add it to your hand; rest to the top or bottom',
      kind: 'auto',
      when: ['startOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              8,
            ],
          },
          then: [
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
                        type: 'Straw Hat Crew',
                      },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'topOrBottomAnyOrder',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, place the rest at the top or bottom" is inside the DON!! guard; topOrBottom is one choice for all the cards, then they go in the order picked (DECISIONS 2026-11-16). The DON!! count is read at the start of the turn, before the Refresh Phase returns given DON!! (cost area plus given)',
  ],
};
