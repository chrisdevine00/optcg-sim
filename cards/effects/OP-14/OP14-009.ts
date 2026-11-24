import type { CardScript } from '../../src/dsl.ts';

/** OP14-009 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_009: CardScript = {
  cardId: 'OP14-009',
  textHash: '1ab1e44b57ef7e',
  verified: {
    source: 'cards/overrides/OP14-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'Once per turn, trash 2 cards from your hand: swap the base power of your Leader and 1 Character during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 2 } } }],
      effect: [
        {
          do: {
            swapBasePower: {
              a: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
              b: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q51 (reading, no ruling): the swap reads base power as it is when the effect resolves',
    'reading: "your Leader and 1 Character" may select this Character itself',
  ],
};
