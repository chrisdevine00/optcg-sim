import type { CardScript } from '../../src/dsl.ts';

/** OP11-073 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_073: CardScript = {
  cardId: 'OP11-073',
  textHash: '1734776416bd34',
  verified: {
    source: 'cards/overrides/OP11-073.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: 'If your Leader has the {Big Mom Pirates} type, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Big Mom Pirates' } }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush' } }],
    },
    {
      id: 'opp-attack',
      label:
        "Once per turn, DON!! -5: choose a cost and reveal the top card of your opponent's deck; if it has that cost, your Leader gains +2000 power this turn",
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ donMinus: 5 }],
      effect: [
        { do: { chooseNumber: { min: 0, max: 10, bind: 'cost' } } },
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed', player: 'opponent' } } },
        {
          if: { ref: 'revealed', matches: { baseCost: { eq: { chosen: 'cost' } } } },
          then: [
            {
              do: {
                power: {
                  target: { from: 'leader', owner: 'you', pick: { upTo: 1 } },
                  amount: 2000,
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
    'reading (G44, M6b-Q67): the number is named before the reveal; the card is compared by its printed cost (a card with no cost never matches) and stays on top of the deck',
    'reading: the +2000 lasts "during this turn" (the whole opponent turn), not only this battle, as printed; DON!! -5 is optional like every DON!! -N cost',
  ],
};
