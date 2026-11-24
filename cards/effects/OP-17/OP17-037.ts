import type { CardScript } from '../../src/dsl.ts';

/** OP17-037 Are You That Afraid of the New Era?!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_037: CardScript = {
  cardId: 'OP17-037',
  textHash: '068527dbbcb054',
  verified: {
    source: 'cards/overrides/OP17-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5; reveal up to 1 card with a type including "Red-Haired Pirates" and add it to your hand',
      kind: 'activate',
      when: 'main',
      effect: [
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
                    typeIncludes: 'Red-Haired Pirates',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'You may rest 1 of your cards: up to 1 of your Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "rest 1 of your cards" is the Leader, a Character, the Stage or an active DON!! (OP15-035 / EB05-019 reading)',
  ],
};
