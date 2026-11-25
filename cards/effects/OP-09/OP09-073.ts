import type { CardScript } from '../../src/dsl.ts';

/** OP09-073 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_073: CardScript = {
  cardId: 'OP09-073',
  textHash: '0dfb73ddc9e72a',
  verified: {
    source: 'cards/overrides/OP09-073.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'attack',
      label:
        "You may return 1 or more DON!! cards from your field to your DON!! deck: give up to 2 of your opponent's Characters -2000 power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 2 } },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2" opposing Characters, -2000 each for the turn; the cost is paid on attacking and is optional',
  ],
};
