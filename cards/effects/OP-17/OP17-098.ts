import type { CardScript } from '../../src/dsl.ts';

/** OP17-098 Gum-Gum Kong Gun. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_098: CardScript = {
  cardId: 'OP17-098',
  textHash: '155b0105701d0d',
  verified: {
    source: 'cards/overrides/OP17-098.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest 6 DON!!: if there is a Character with a cost of 12 or more, K.O. up to 2 of your opponent's Characters with a cost of 6 or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 6,
        },
      ],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'any',
              filter: {
                cost: {
                  gte: 12,
                },
              },
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 6,
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
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
