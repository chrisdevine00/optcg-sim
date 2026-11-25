import type { CardScript } from '../../src/dsl.ts';

/** OP11-081 Cognac Mama-Mash. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_081: CardScript = {
  cardId: 'OP11-081',
  textHash: '1422f3462d6156',
  verified: {
    source: 'cards/overrides/OP11-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Choose a cost and reveal the top card of your opponent's deck; if it has that cost, K.O. up to 1 of their Characters with a base cost of 8 or less",
      kind: 'activate',
      when: 'main',
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
                  filter: { baseCost: { lte: 8 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 DON!! card from your DON!! deck and set it as active',
      kind: 'trigger',
      effect: [{ do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
    },
  ],
  rulings: [
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
  ],
};
