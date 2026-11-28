import type { CardScript } from '../../src/dsl.ts';

/** OP18-072 The Franky Family. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_072: CardScript = {
  cardId: 'OP18-072',
  textHash: '079d43a7e6c382',
  verified: {
    source: 'cards/overrides/OP18-072.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'minus',
      label:
        "You may K.O. 1 of your Stages with a cost of 5 or less: if this Character was played on this turn, give up to 1 opponent's Character −3000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          ko: { from: 'stage', owner: 'you', filter: { cost: { lte: 5 } }, pick: { exactly: 1 } },
        },
      ],
      effect: [
        {
          if: { self: { playedThisTurn: true } },
          then: [
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
    },
  ],
  rulings: [
    'OP-18 wave G2: a K.O. cost may K.O. your own Stage',
    'a colon-less "If" is an effect condition: on a later turn the Stage is still K.O.\'d and the Once Per Turn is spent (STATUS process lessons)',
  ],
};
