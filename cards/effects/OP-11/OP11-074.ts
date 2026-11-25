import type { CardScript } from '../../src/dsl.ts';

/** OP11-074 Streusen. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_074: CardScript = {
  cardId: 'OP11-074',
  textHash: '107159ba31776c',
  verified: {
    source: 'cards/overrides/OP11-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'choose-cost',
      label:
        "Once per turn, DON!! -1, you may rest this Character: choose a cost and reveal the top card of your opponent's deck; if it has that cost, rest up to 1 of their Characters with a cost of 4 or less",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ donMinus: 1 }, { restSelf: true }],
      effect: [
        { do: { chooseNumber: { min: 0, max: 10, bind: 'cost' } } },
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed', player: 'opponent' } } },
        {
          if: { ref: 'revealed', matches: { baseCost: { eq: { chosen: 'cost' } } } },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 4 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
    'reading: "You may rest this Character" is part of the cost; activating the ability is the player\'s choice, so the whole cost (DON!! -1 and the rest) is paid or the ability is not activated (optional-cost.ts: an [Activate: Main] carries no costOptional)',
    'reading: "a cost of 4 or less" is the Character\'s current cost',
  ],
};
