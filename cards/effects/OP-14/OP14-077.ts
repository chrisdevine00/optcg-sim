import type { CardScript } from '../../src/dsl.ts';

/** OP14-077 Penta-Chromatic String. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_077: CardScript = {
  cardId: 'OP14-077',
  textHash: '0dd97580f09470',
  verified: {
    source: 'cards/overrides/OP14-077.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 Leader or Character +4000 power during this battle; if your opponent has a Character with 6000 power or more, add up to 1 DON!! rested',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  gte: 6000,
                },
              },
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
  ],
  rulings: [
    'reading: "Then, if" is independent of the power target (the DON!! is added even if no card was chosen); current power, inclusive at 6000, opposing Characters only',
  ],
};
