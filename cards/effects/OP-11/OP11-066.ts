import type { CardScript } from '../../src/dsl.ts';

/** OP11-066 Charlotte Oven. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_066: CardScript = {
  cardId: 'OP11-066',
  textHash: '08b6baefb5baab',
  verified: {
    source: 'cards/overrides/OP11-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'choose-cost',
      label:
        "You may rest this Character: choose a cost and reveal the top card of your opponent's deck; if it has that cost, K.O. up to 1 of their Characters with a base cost of 3 or less, then add up to 1 DON!! card and rest it",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        { do: { chooseNumber: { min: 0, max: 10, bind: 'cost' } } },
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed', player: 'opponent' } } },
        {
          if: { ref: 'revealed', matches: { baseCost: { eq: { chosen: 'cost' } } } },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { baseCost: { lte: 3 } },
                  pick: { upTo: 1 },
                },
              },
            },
            { do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
    'reading (M4b-5): "Then, add up to 1 DON!!" follows the If-clause, so with a miss it does not resolve; on a match it is added whether or not a Character was K.O.\'d (a Then is not an If you do)',
  ],
};
