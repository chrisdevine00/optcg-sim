import type { CardScript } from '../../src/dsl.ts';

/** OP18-071 Trebol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_071: CardScript = {
  cardId: 'OP18-071',
  textHash: '14cad9d949b0a2',
  verified: {
    source: 'cards/overrides/OP18-071.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your {Donquixote Pirates} type Character would be removed from the field by your opponent's effect, you may DON!! −1 instead",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Donquixote Pirates',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
    {
      id: 'sugar',
      label:
        "[Opponent's Turn] If your Leader is [Sugar], this Character gains [Blocker] and +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          leader: {
            name: 'Sugar',
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
  ],
  rulings: [
    'audit Q12 (text defect, proposed reading): the printed text reads "this Characters gains [Blocker]"; read as "this Character"; "{Sugar}" in braces is read as the Leader named [Sugar] (no card has a type "Sugar": OP10-003 is the Leader named Sugar)',
    "audit Q4: the replacement covers Trebol himself (a {Donquixote Pirates} Character); as OP14-061, once per turn and for removal by the opponent's effect only",
  ],
};
