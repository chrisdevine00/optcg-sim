import type { CardScript } from '../../src/dsl.ts';

/** OP17-097 I'll Feed on This Rage. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_097: CardScript = {
  cardId: 'OP17-097',
  textHash: '13dd2c3f84675a',
  verified: {
    source: 'cards/overrides/OP17-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "Give all of your opponent's Characters -1 cost during this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            cost: {
              target: { from: 'characters', owner: 'opponent' },
              amount: -1,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the -1 cost reaches the Characters on the opponent\'s field when the Event resolves (a snapshot, like every "all of" target); Characters played later this turn are not affected',
  ],
};
