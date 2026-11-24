import type { CardScript } from '../../src/dsl.ts';

/** EB03-041 Kujyaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_041: CardScript = {
  cardId: 'EB03-041',
  textHash: '09b479dbc7599c',
  verified: {
    source: 'cards/overrides/EB03-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: "Opponent's turn: your {SWORD} Characters with a cost of 6 or less gain +2000 power",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ type: 'SWORD' }, { cost: { lte: 6 } }] },
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Trash 1 {Navy} card from your hand: draw 2',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        { trash: { from: 'hand', owner: 'you', filter: { type: 'Navy' }, pick: { exactly: 1 } } },
      ],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
