import type { CardScript } from '../../src/dsl.ts';

/** EB04-022 Issho. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_022: CardScript = {
  cardId: 'EB04-022',
  textHash: '03973257b4a2b4',
  verified: {
    source: 'cards/overrides/EB04-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 2 cards from your hand: if your opponent has 6 or more cards in hand, they place 2 cards from their hand at the bottom of their deck in any order',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              6,
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
                      exactly: 2,
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
      id: 'when-attacking',
      label:
        "[DON!! x1] You may trash 1 card from your hand: give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      cost: [
        {
          trash: {
            from: 'hand',
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
    "reading: the opponent's hand size is checked after your 2-card cost is paid (it is theirs, not yours); they choose which 2 and then the order; with 5 or fewer cards nothing is placed (the cost is still paid)",
  ],
};
