import type { CardScript } from '../../src/dsl.ts';

/** OP14-098 Crescent Cutlass. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_098: CardScript = {
  cardId: 'OP14-098',
  textHash: '1cbab1cef81393',
  verified: {
    source: 'cards/overrides/OP14-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "With a Character of cost 0 or 8+: your Baroque Works Characters gain +3 cost until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            any: [
              { exists: { from: 'characters', owner: 'any', filter: { cost: { eq: 0 } } } },
              { exists: { from: 'characters', owner: 'any', filter: { cost: { gte: 8 } } } },
            ],
          },
          then: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { typeIncludes: 'Baroque Works' },
                  },
                  amount: 3,
                  duration: 'untilEndOfOpponentsNextTurn',
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
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
};
