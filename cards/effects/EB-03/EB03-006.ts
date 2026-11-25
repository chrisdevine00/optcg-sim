import type { CardScript } from '../../src/dsl.ts';

/** EB03-006 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_006: CardScript = {
  cardId: 'EB03-006',
  textHash: '025023a5b3b21b',
  verified: {
    source: 'cards/overrides/EB03-006.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may give your active Leader −5000 power during this turn: draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          power: {
            target: {
              from: 'leader',
              owner: 'you',
              filter: {
                state: 'active',
              },
              pick: {
                exactly: 1,
              },
            },
            amount: -5000,
            duration: 'thisTurn',
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        "[Once Per Turn] If your Leader has the {Alabasta} type, give up to 1 of your opponent's Characters −1000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            leader: {
              type: 'Alabasta',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -1000,
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
    'reading (G62, M6b-Q79): the cost needs an active Leader and can be paid again; the power changes add up',
    'reading: "If your Leader has the {Alabasta} type" has no colon, so it is an effect condition: the [Activate: Main] is activated and [Once Per Turn] is spent whatever the Leader is, and then nothing happens; the target is chosen when the effect resolves, "up to 1"',
  ],
};
