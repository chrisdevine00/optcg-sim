import type { CardScript } from '../../src/dsl.ts';

/** OP14-092 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_092: CardScript = {
  cardId: 'OP14-092',
  textHash: '0bbec42582df88',
  verified: {
    source: 'cards/overrides/OP14-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trash-shield',
      label:
        "Opponent's turn, once per turn: place 3 cards from your trash at the bottom of your deck instead of being K.O.'d",
      kind: 'replacement',
      oncePerTurn: true,
      conditions: [{ opponentsTurn: true }],
      replaces: { ko: { from: 'characters', owner: 'you', filter: { isSelf: true } } },
      optional: true,
      instead: [
        {
          move: { from: 'trash', owner: 'you', pick: { exactly: 3 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
    },
  ],
};
