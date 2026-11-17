import type { CardScript } from '../../src/dsl.ts';

/** OP11-012 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_012: CardScript = {
  cardId: 'OP11-012',
  textHash: '128579576b9867',
  verified: {
    source: 'cards/overrides/OP11-012.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'event-boost',
      label: 'When your opponent activates an Event: all your Characters gain +2000 power',
      kind: 'auto',
      when: [
        {
          event: 'eventActivated',
          by: 'opponent',
        },
      ],
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "[Your Turn] [Once Per Turn] When your opponent activates an Event" fires only on your turn (a Counter Event in your attack) and once per turn',
  ],
};
