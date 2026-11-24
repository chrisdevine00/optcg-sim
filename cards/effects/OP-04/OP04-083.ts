import type { CardScript } from '../../src/dsl.ts';

/** OP04-083 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP04_083: CardScript = {
  cardId: 'OP04-083',
  textHash: '1a77b3b50ba7d3',
  verified: {
    source: 'cards/overrides/OP04-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "None of your Characters can be K.O.'d by effects until the start of your next turn; draw 2 cards and trash 2 cards from your hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you' },
              what: { cannotBeKOd: { cause: 'effect' } },
              duration: 'untilStartOfYourNextTurn',
            },
          },
        },
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
      ],
    },
  ],
  rulings: [
    "Reading (M6b-Q15): covers the Characters on your field when it resolves (Sabo included), not later arrivals; lasts through the opponent's whole turn",
    'Reading: the protection is against effects only, so battle K.O. still applies',
  ],
};
