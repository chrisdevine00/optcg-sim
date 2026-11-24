import type { CardScript } from '../../src/dsl.ts';

/** OP17-101 Caribou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_101: CardScript = {
  cardId: 'OP17-101',
  textHash: '19177903b0887e',
  verified: {
    source: 'cards/overrides/OP17-101.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power-down',
      label:
        "Add 1 card from the top of your Life to your hand: give up to 1 of your opponent's Characters -3000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ lifeToHand: { from: 'top', n: 1 } }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Trash 1 card from your hand: K.O. up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 5 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
