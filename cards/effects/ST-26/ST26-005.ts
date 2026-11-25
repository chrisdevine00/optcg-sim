import type { CardScript } from '../../src/dsl.ts';

/** ST26-005 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST26_005: CardScript = {
  cardId: 'ST26-005',
  textHash: '11234ce4100c0b',
  verified: {
    source: 'cards/overrides/ST26-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'seven-thousand',
      label:
        "DON!! -2: if your Leader is multicolored and your opponent has 5 or more DON!! cards, your {Straw Hat Crew} Leader's base power becomes 7000 until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay', 'whenAttacking'],
      cost: [{ donMinus: 2 }],
      effect: [
        {
          if: {
            all: [{ leader: { multicolor: true } }, { cmp: [{ donOnField: 'opponent' }, '>=', 5] }],
          },
          then: [
            {
              do: {
                setBasePower: {
                  target: { from: 'leader', owner: 'you', filter: { type: 'Straw Hat Crew' } },
                  value: 7000,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon, so it is an effect condition: the DON!! -2 is paid and nothing happens when it fails; the opponent\'s DON!! count is the whole field (cost area plus given, rested included), inclusive at 5',
    'reading: "until the end of your opponent\'s next End Phase" is the plain duration untilEndOfOpponentsNextTurn; the Leader must itself be multicolored and {Straw Hat Crew}',
  ],
};
