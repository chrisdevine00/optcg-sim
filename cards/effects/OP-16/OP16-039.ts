import type { CardScript } from '../../src/dsl.ts';

/** OP16-039 Gum-Gum Twin Jet Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_039: CardScript = {
  cardId: 'OP16-039',
  textHash: '1baec0b9363db5',
  verified: {
    source: 'cards/overrides/OP16-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Up to 1 of your [Monkey.D.Luffy] cards gains [Double Attack]; if your Leader has the {Impel Down} type, rest up to 2 of your opponent's Characters with a cost of 3 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            grant: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Double Attack',
              duration: 'thisTurn',
            },
          },
        },
        {
          if: {
            leader: {
              type: 'Impel Down',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 3,
                    },
                  },
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest your opponent's Leader",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'leader',
              owner: 'opponent',
            },
          },
        },
      ],
    },
  ],
};
