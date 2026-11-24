import type { CardScript } from '../../src/dsl.ts';

/** OP11-019 Glorp Web!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_019: CardScript = {
  cardId: 'OP11-019',
  textHash: '11c79941e439d6',
  verified: {
    source: 'cards/overrides/OP11-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        '+2000 power during this battle to your Leader or a Character; then if your opponent has a Character with 6000 power or more, up to 1 gains +1000 power this turn',
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
              amount: 2000,
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
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 of your Leader or Character cards gains +1000 power this turn',
      kind: 'trigger',
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
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "if your opponent has a Character with 6000 power or more" is read after the first boost resolves, on current power; the second boost is its own pick and may differ from the first; it lasts the turn',
  ],
};
