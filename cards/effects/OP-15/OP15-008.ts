import type { CardScript } from '../../src/dsl.ts';

/** OP15-008 Krieg. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_008: CardScript = {
  cardId: 'OP15-008',
  textHash: '036c684f65a046',
  verified: {
    source: 'cards/overrides/OP15-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Give up to 3 of your opponent's rested DON!! cards to 1 of your opponent's Characters; then this Character gains [Rush] this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 3,
              state: 'rested',
              from: 'opponent',
              to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
            },
          },
        },
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'shrink',
      label:
        "If this Character was played this turn, give all of your opponent's Characters -1000 power for every DON!! given to that Character",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ isSelf: true }, { playedThisTurn: true }] },
            },
          },
          then: [
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'opponent' },
                  amount: { mul: [{ donGivenToTarget: true }, -1000] },
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
    'reading (M6b-Q55): "that Character" in "for every DON!! card given to that Character" is each affected Character in turn: each opposing Character gets -1000 for each DON!! given to it (the wave 4 per-target amount); one with none gets 0',
    'reading: "Then, this Character gains [Rush]" is not conditional on the DON!! being given (the Rush is granted even when no rested DON!! was available or no Character was chosen)',
    'reading: "Give up to 3 ... to 1 of your opponent\'s Characters" asks the count (0 to the rested DON!! available, most first) and the target; the DON!! are the opponent\'s own and return to their cost area at their Refresh Phase (CR 6-2-3)',
    'reading: the Activate\'s leading "If" has no colon, so it is an effect condition: the activation is offered and Once Per Turn is spent even when the Character was not played this turn',
  ],
};
