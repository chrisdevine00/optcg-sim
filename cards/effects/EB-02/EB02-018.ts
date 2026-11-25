import type { CardScript } from '../../src/dsl.ts';

/** EB02-018 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_018: CardScript = {
  cardId: 'EB02-018',
  textHash: '0ae43d63838108',
  verified: {
    source: 'cards/overrides/EB02-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If you have no other [Buggy] Characters, your Leader gains [Double Attack] this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    name: 'Buggy',
                  },
                  {
                    isSelf: false,
                  },
                ],
              },
            },
          },
          then: [
            {
              do: {
                grant: {
                  target: {
                    from: 'leader',
                    owner: 'you',
                  },
                  keyword: 'Double Attack',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of the opponent's Characters with cost 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "no other [Buggy] Characters" counts Characters on your field only; another Buggy of any card id blocks it; "up to 1 of your Leader" is the Leader (no choice)',
  ],
};
