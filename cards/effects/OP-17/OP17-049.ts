import type { CardScript } from '../../src/dsl.ts';

/** OP17-049 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_049: CardScript = {
  cardId: 'OP17-049',
  textHash: '079cd5dde67101',
  verified: {
    source: 'cards/overrides/OP17-049.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Your opponent chooses: you draw 2, or they trash 2',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  draw: 2,
                },
              },
            ],
            [
              {
                do: {
                  trashFromHand: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    pick: {
                      exactly: 2,
                    },
                  },
                },
              },
            ],
          ],
          chooser: 'opponent',
          labels: ['Your opponent draws 2 cards.', 'You trash 2 cards from your hand.'],
          neutral: [
            "Charlotte Linlin's player draws 2 cards.",
            "Charlotte Linlin's opponent trashes 2 cards from their hand.",
          ],
        },
      ],
    },
    {
      id: 'opp-attack',
      label: 'Up to 1 of your Leader or Characters gains +1000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
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
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 OP17-049: the controller draws; the opponent chooses their own 2 cards; the trash mode may be chosen with 1 or 0 cards',
  ],
};
