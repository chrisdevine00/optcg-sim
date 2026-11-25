import type { CardScript } from '../../src/dsl.ts';

/** ST22-016 Take That Back!! Take Back What You Said!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_016: CardScript = {
  cardId: 'ST22-016',
  textHash: '0f3442060a4006',
  verified: {
    source: 'cards/overrides/ST22-016.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Reveal 1 card from the top of your deck; if its type includes "Whitebeard Pirates", up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            reveal: {
              from: 'deckTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              typeIncludes: 'Whitebeard Pirates',
            },
          },
          then: [
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
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is colon-less, an effect condition; the top card is shown whatever it is, and a miss leaves it on top',
  ],
};
