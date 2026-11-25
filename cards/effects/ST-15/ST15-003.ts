import type { CardScript } from '../../src/dsl.ts';

/** ST15-003 Kingdew. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST15_003: CardScript = {
  cardId: 'ST15-003',
  textHash: '031cdd42707f2a',
  verified: {
    source: 'cards/overrides/ST15-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        "Opponent's Turn: when this Character is K.O.'d by an effect, up to 1 of your Leader gains +2000 power during this turn",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ opponentsTurn: true }, { koCause: 'effect' }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you', pick: { upTo: 1 } },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "G28: \"K.O.'d by an effect\" is an effect of either player or a cost (a battle K.O. does not count); on the opponent's turn that is the opponent's effect or one of your own triggered effects",
  ],
};
