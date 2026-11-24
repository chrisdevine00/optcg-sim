import type { CardScript } from '../../src/dsl.ts';

/** EB03-026. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_026: CardScript = {
  cardId: 'EB03-026',
  textHash: '0aaa2b7147f03f',
  verified: {
    source: 'cards/overrides/EB03-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your opponent has 5 or more cards in their hand, your opponent places 1 card from their hand at the bottom of their deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    pick: {
                      exactly: 1,
                    },
                  },
                  to: {
                    zone: 'deck',
                    position: 'bottom',
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'give-don',
      label:
        "Once per turn, you may place 1 of your Characters at the bottom of the owner's deck: give your Leader and 1 Character up to 1 rested DON!! card each",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'you',
              pick: {
                exactly: 1,
              },
              bind: 'chosen',
            },
          },
        },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              each: true,
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      category: ['Leader'],
                    },
                    {
                      ref: 'chosen',
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the opponent chooses the card they place (a public hand-size gate, no hidden-zone gate); "1 of your Characters" for the cost may be Boa Hancock herself (then the Character is chosen among the others); the Character for the DON!! is chosen after the cost, as OP13-042',
  ],
};
