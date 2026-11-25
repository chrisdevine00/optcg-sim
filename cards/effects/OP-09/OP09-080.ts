import type { CardScript } from '../../src/dsl.ts';

/** OP09-080 Thousand Sunny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_080: CardScript = {
  cardId: 'OP09-080',
  textHash: '0ae675a4635adb',
  verified: {
    source: 'cards/overrides/OP09-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'sunny',
      label:
        "[Opponent's Turn] Rest this Stage: when your Straw Hat Crew Character is removed from the field by your opponent's effect, add up to 1 DON!! card from your DON!! deck and rest it",
      kind: 'auto',
      when: [
        {
          event: 'removed',
          owner: 'you',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                type: 'Straw Hat Crew',
              },
            ],
          },
          cause: 'opponentEffect',
        },
      ],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the rest cost is paid when the removal happens (an optional offer, as an auto with a cost); "removed from the field" is any move off the field (a K.O., trash, return to hand or deck) by the opponent\'s effect, as G29',
  ],
};
