import type { CardScript } from '../../src/dsl.ts';

/** OP18-020 Stop Fighting!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_020: CardScript = {
  cardId: 'OP18-020',
  textHash: '1a6bc5b5971b8f',
  verified: {
    source: 'cards/overrides/OP18-020.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "You may add all of your Life cards to your hand: if your Leader is [Nefeltari Vivi], give your opponent's Leader and all of their Characters −5000 power during this turn",
      kind: 'activate',
      when: 'counter',
      costOptional: true,
      cost: [{ lifeToHand: { from: 'top', n: 'all' } }],
      effect: [
        {
          if: { leader: { name: 'Nefeltari Vivi' } },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'opponent' },
                  amount: -5000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'OP-18 wave G4: "all of your Life cards" as a cost, payable with any number of Life cards, none included (M6b-Q97); not damage, no [Trigger]',
    'a colon-less "If" is an effect condition: the Life cards go to the hand even when the Leader is not [Nefeltari Vivi]',
  ],
};
