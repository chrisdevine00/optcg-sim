import type { CardScript } from '../../src/dsl.ts';

/** OP17-072 Black Maria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_072: CardScript = {
  cardId: 'OP17-072',
  textHash: '0764f7b6a4fa1b',
  verified: {
    source: 'cards/overrides/OP17-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'Trash 1 card from your hand: up to 1 of your Leader or Characters gains +1000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
