import type { CardScript } from '../../src/dsl.ts';

/** OP15-100 Kamakiri. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_100: CardScript = {
  cardId: 'OP15-100',
  textHash: '19a2fe346074b6',
  verified: {
    source: 'cards/overrides/OP15-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash this Character and add 1 card from the top of your Life cards to your hand: K.O. up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trashSelf: true }, { lifeToHand: { from: 'top', n: 1 } }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 6 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
