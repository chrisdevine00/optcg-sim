import type { CardScript } from '../../src/dsl.ts';

/** OP09-097 Black Vortex. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_097: CardScript = {
  cardId: 'OP09-097',
  textHash: '1f246da6fd5183',
  verified: {
    source: 'cards/overrides/OP09-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "[Counter] Negate the effect of up to 1 of your opponent's Leader or Character cards and give that card -4000 power this turn",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            negate: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
                bind: 'neg',
              },
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                filter: {
                  ref: 'neg',
                },
              },
              amount: -4000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Negate the effect of up to 1 of your opponent's Leader or Character cards this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            negate: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "give that card -4000" is the card the negate chose; with no card chosen nothing happens; the -4000 lasts until the end of the turn, not only the battle',
  ],
};
