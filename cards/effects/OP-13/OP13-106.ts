import type { CardScript } from '../../src/dsl.ts';

/** OP13-106 Conney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_106: CardScript = {
  cardId: 'OP13-106',
  textHash: '1e905205d99add',
  verified: {
    source: 'cards/overrides/OP13-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        "[Opponent's Turn] When a [Trigger] activates, this Character gains [Blocker] during this turn",
      kind: 'auto',
      when: [{ event: 'triggerActivated', by: 'any' }],
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Blocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    "reading (G56, M6b-Q72): \"a [Trigger]\" is either player's (`by: 'any'`); it fires when a [Trigger] is activated, not when a Life card is added to the hand; the [Blocker] arrives after the [Trigger] and the damage processing, so it does not help against the attack that dealt the damage; the grant lasts to the end of the turn",
  ],
};
