import type { CardScript } from '../../src/dsl.ts';

/** OP11-041 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_041: CardScript = {
  cardId: 'OP11-041',
  textHash: '1c824e949e12a8',
  verified: {
    source: 'cards/overrides/OP11-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'life-removed',
      label:
        "[Your Turn] When a card is removed from your or your opponent's Life: with 7 or less cards in hand, draw 1",
      kind: 'auto',
      optional: true,
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
        },
      ],
      when: [
        {
          event: 'lifeRemoved',
          owner: 'any',
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              7,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'opp-attack',
      label: '[DON!! x1] You may trash 1 card: this Leader gains +2000 power during this turn',
      kind: 'auto',
      oncePerTurn: true,
      conditions: [
        {
          donGiven: 1,
        },
      ],
      when: ['onOpponentAttack'],
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
                from: 'self',
                owner: 'you',
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "This effect can be activated when a card is removed ... If you have 7 or less cards in your hand, draw" -- the hand check is made when the effect resolves, and the Once Per Turn is used by the activation (the removal), not by the draw',
    'reading: the first ability counts a Life card removed by any means (damage, an effect, a cost), from either player, but only on your own turn',
  ],
};
