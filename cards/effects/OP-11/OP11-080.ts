import type { CardScript } from '../../src/dsl.ts';

/** OP11-080 Gear Two. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_080: CardScript = {
  cardId: 'OP11-080',
  textHash: '1a72d539109614',
  verified: {
    source: 'cards/overrides/OP11-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 2 DON!!: if your Leader's colors include blue, add up to 1 DON!! and rest it",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 2,
        },
      ],
      costOptional: true,
      effect: [
        {
          if: {
            leader: {
              color: 'Blue',
            },
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
