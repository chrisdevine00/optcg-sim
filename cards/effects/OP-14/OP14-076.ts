import type { CardScript } from '../../src/dsl.ts';

/** OP14-076 Ever White. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_076: CardScript = {
  cardId: 'OP14-076',
  textHash: '19c81b8f0fe0f1',
  verified: {
    source: 'cards/overrides/OP14-076.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 2 DON!!: if your Leader has {Donquixote Pirates}, add up to 1 DON!! rested',
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
              type: 'Donquixote Pirates',
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
  rulings: [
    'reading: the "If" follows the colon, so the 2 DON!! are rested even when the Leader check fails',
  ],
};
