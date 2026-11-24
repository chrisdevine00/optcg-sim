import type { CardScript } from '../../src/dsl.ts';

/** ST29-015 Raw Heat Strike. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_015: CardScript = {
  cardId: 'ST29-015',
  textHash: '036b346881bd48',
  verified: {
    source: 'cards/overrides/ST29-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "Up to 1 of your Leader or Character cards gains +2000 power during this battle; then, with 1 or less Life, give up to 1 of your opponent's Leader or Character cards -2000 power during this turn",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          if: { cmp: [{ life: 'you' }, '<=', 1] },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    { id: 'trigger', label: 'Draw 1 card', kind: 'trigger', effect: [{ do: { draw: 1 } }] },
  ],
  rulings: [
    'reading (M4b-5): "Then, if" is its own condition, checked as the second part resolves; the +2000 is chosen first and may be declined, which does not stop the -2000',
  ],
};
