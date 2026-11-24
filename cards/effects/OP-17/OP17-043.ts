import type { CardScript } from '../../src/dsl.ts';

/** OP17-043 Ganzui. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_043: CardScript = {
  cardId: 'OP17-043',
  textHash: '1b24a838b1047a',
  verified: {
    source: 'cards/overrides/OP17-043.json (card text in cards/data)',
    date: '2026-11-24',
    note: 'the verified text has no "by your opponent\'s effect": the replacement covers every removal (audit Q3)',
  },
  abilities: [
    {
      id: 'stay',
      label:
        'If this Character would be removed from the field, you may trash 2 cards from your hand instead',
      kind: 'replacement',
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'any',
      },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 2 } } }],
    },
    {
      id: 'on-play',
      label:
        "Your Leader's base power becomes 6000 until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setBasePower: {
              target: { from: 'leader', owner: 'you' },
              value: 6000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "G14 reading (m6b-wave2 reading 4): any removal (battle K.O., your own or the opponent's effects, bounce) may be replaced; a rule trash for Character-area room is not; not offered with fewer than 2 cards in hand (CR 8-1-3-4-5)",
    'reading: "becomes 6000" is a set, so it also lowers a Leader printed above 6000',
  ],
};
