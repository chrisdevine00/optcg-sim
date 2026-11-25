import type { CardScript } from '../../src/dsl.ts';

/** OP11-071 Charlotte Perospero. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_071: CardScript = {
  cardId: 'OP11-071',
  textHash: '11007b7cc648b0',
  verified: {
    source: 'cards/overrides/OP11-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'choose-cost',
      label:
        "Once per turn, you may trash 1 card from your hand: choose a cost and reveal the top card of your opponent's deck; if it has that cost, draw 1 card and add up to 1 DON!! card as active",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        { do: { chooseNumber: { min: 0, max: 10, bind: 'cost' } } },
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed', player: 'opponent' } } },
        {
          if: { ref: 'revealed', matches: { baseCost: { eq: { chosen: 'cost' } } } },
          then: [{ do: { draw: 1 } }, { do: { addDon: [{ n: 1, state: 'active', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
    'reading: the hand card is trashed as the cost (the ability is not offered with an empty hand) and Once Per Turn is spent whether or not the revealed card matches',
  ],
};
