import type { CardScript } from '../../src/dsl.ts';

/** OP14-027 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_027: CardScript = {
  cardId: 'OP14-027',
  textHash: '11e0bc6c6eb59a',
  verified: {
    source: 'cards/overrides/OP14-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your turn, when this becomes rested: rest up to 1 of the opponent's Characters with 7000 base power or less",
      kind: 'auto',
      when: [
        {
          event: 'rested',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 7000,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'rested-debuff',
      label: "Opponent's turn, if rested: all your opponent's Characters get -1000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          self: {
            state: 'rested',
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'opponent',
            },
            amount: -1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q10): "give all ... -1000 power" with no duration is a continuous effect while this is rested on the opponent\'s turn (Characters that arrive later are covered too); Shanks does not affect the opposing Leader',
  ],
};
