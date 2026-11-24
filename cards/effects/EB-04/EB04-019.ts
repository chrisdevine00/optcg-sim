import type { CardScript } from '../../src/dsl.ts';

/** EB04-019 Eleclaw. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_019: CardScript = {
  cardId: 'EB04-019',
  textHash: '179ea368b67475',
  verified: {
    source: 'cards/overrides/EB04-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 1 of your cards: if your Leader has {Minks}, give up to 1 of your opponent's Characters -3 cost during this turn",
      kind: 'activate',
      when: 'main',
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
          if: {
            leader: {
              type: 'Minks',
            },
          },
          then: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label:
        'Up to 1 of your {Minks} Leader or Character cards gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'Minks',
                },
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
    'reading: the Leader check follows the colon, so it is an effect condition: the cost is paid (optional) and the effect does nothing with a non-{Minks} Leader',
  ],
};
