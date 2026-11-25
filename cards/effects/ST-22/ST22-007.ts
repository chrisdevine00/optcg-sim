import type { CardScript } from '../../src/dsl.ts';

/** ST22-007 Squard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_007: CardScript = {
  cardId: 'ST22-007',
  textHash: '02e129caa9a588',
  verified: {
    source: 'cards/overrides/ST22-007.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'give-don',
      label:
        'Once Per Turn, reveal 1 card from the top of your deck; if its type includes "Whitebeard Pirates", give up to 1 rested DON!! to your Leader or 1 Character',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
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
                giveDon: {
                  n: 1,
                  state: 'rested',
                  to: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      exactly: 1,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is colon-less, an effect condition: the Once Per Turn is spent and the top card is shown even when it is not {Whitebeard Pirates}',
  ],
};
