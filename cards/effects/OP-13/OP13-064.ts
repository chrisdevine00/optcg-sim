import type { CardScript } from '../../src/dsl.ts';

/** OP13-064 Gol.D.Roger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_064: CardScript = {
  cardId: 'OP13-064',
  textHash: '03e17c65744e5a',
  verified: {
    source: 'cards/overrides/OP13-064.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'negate',
      label:
        'Your Leader and all of your Characters that do not have a type including "Roger Pirates" have their effects negated',
      kind: 'permanent',
      apply: [
        {
          negate: {
            target: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                not: {
                  typeIncludes: 'Roger Pirates',
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "[On Play] DON!! -3: your Leader gains +2000 power until the end of your opponent's next End Phase, then all of your opponent's Characters get -2000 power for the same time",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 3,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
              },
              amount: -2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G66, M6b-Q83): the type clause reads both the Leader and the Characters ("Your Leader and all of your Characters that do not have a type including ..."), so a {Roger Pirates} Leader is not negated; the type is a substring of a type element, read from the printed list; this card is never negated by itself',
    'reading: "Then" after the cost is plain sequence (both power changes run); the -2000 reaches the opponent Characters on the field when it resolves, not ones played later',
  ],
};
