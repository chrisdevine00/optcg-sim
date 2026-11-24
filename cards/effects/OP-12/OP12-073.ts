import type { CardScript } from '../../src/dsl.ts';

/** OP12-073 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_073: CardScript = {
  cardId: 'OP12-073',
  textHash: '19e4710770eda4',
  verified: {
    source: 'cards/overrides/OP12-073.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have no more DON!! than your opponent: add up to 1 DON!! and set it as active; then your [Donquixote Rosinante] and {Heart Pirates} Characters gain +1000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
          then: [
            { do: { addDon: [{ n: 1, state: 'active', upTo: true }] } },
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { any: [{ name: 'Donquixote Rosinante' }, { type: 'Heart Pirates' }] },
                  },
                  amount: 1000,
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
    'Reading (M4b-5, RD 121-122): "Then, all of your ..." sits inside the "If" and does not resolve when the DON!! condition fails; it is "Then", not "If you do", so declining the DON!! still gives the power; Law is a {Heart Pirates} Character and is included; only Characters on the field when it resolves are affected',
  ],
};
