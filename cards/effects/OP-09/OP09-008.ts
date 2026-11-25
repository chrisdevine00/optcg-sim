import type { CardScript } from '../../src/dsl.ts';

/** OP09-008 Building Snake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_008: CardScript = {
  cardId: 'OP09-008',
  textHash: '1a2af732aa31bd',
  verified: {
    source: 'cards/overrides/OP09-008.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may place this Character at the bottom of the owner's deck: give up to 1 of your opponent's Characters -3000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
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
  ],
};
