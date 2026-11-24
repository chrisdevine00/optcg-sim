import type { CardScript } from '../../src/dsl.ts';

/** OP11-067 Charlotte Katakuri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_067: CardScript = {
  cardId: 'OP11-067',
  textHash: '03ebfa614c1ed3',
  verified: {
    source: 'cards/overrides/OP11-067.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'end-of-turn',
      label:
        'Set up to 2 of your {Big Mom Pirates} Characters with cost 3 or more as active; then add up to 1 DON!! and rest it',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Big Mom Pirates',
                  },
                  {
                    cost: {
                      gte: 3,
                    },
                  },
                ],
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
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
};
