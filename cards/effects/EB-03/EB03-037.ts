import type { CardScript } from '../../src/dsl.ts';

/** EB03-037 Lim. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_037: CardScript = {
  cardId: 'EB03-037',
  textHash: '16e8bf7ddf9c7d',
  verified: {
    source: 'cards/overrides/EB03-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 7 or more DON!!, all your {ODYSSEY} Leader and Characters gain +1000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '>=', 7] },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: { type: 'ODYSSEY' },
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
};
