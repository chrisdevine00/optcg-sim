import type { CardScript } from '../../src/dsl.ts';

/** EB03-011. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_011: CardScript = {
  cardId: 'EB03-011',
  textHash: '0b70d407f9babc',
  verified: {
    source: 'cards/overrides/EB03-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If your Leader is [Nefeltari Vivi], up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            leader: {
              name: 'Nefeltari Vivi',
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
      label: "Give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "If your Leader is [Nefeltari Vivi]" has no colon, so it is an `if` step: the Counter is played and does nothing for another Leader',
  ],
};
