import type { CardScript } from '../../src/dsl.ts';

/** OP11-079 When Two Men Are Fighting the Last Thing I Need Is Some Half-Hearted Assistance!!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_079: CardScript = {
  cardId: 'OP11-079',
  textHash: '0cb7a6e2f5f87d',
  verified: {
    source: 'cards/overrides/OP11-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "Choose a cost and reveal the top card of your opponent's deck; if it has that cost, up to 1 of your Leader or Character cards gains +5000 power during this battle",
      kind: 'activate',
      when: 'counter',
      effect: [
        { do: { chooseNumber: { min: 0, max: 10, bind: 'cost' } } },
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed', player: 'opponent' } } },
        {
          if: { ref: 'revealed', matches: { baseCost: { eq: { chosen: 'cost' } } } },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
                  amount: 5000,
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
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
  ],
};
