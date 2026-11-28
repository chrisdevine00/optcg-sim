import type { CardScript } from '../../src/dsl.ts';

/** OP18-039 Gum-Gum Giant Axe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_039: CardScript = {
  cardId: 'OP18-039',
  textHash: '1a23ff2dacd78b',
  verified: {
    source: 'cards/overrides/OP18-039.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your [Monkey.D.Luffy] gains +2000 power during this battle; then, if your Leader is active, draw 1 card',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Monkey.D.Luffy' },
                pick: { upTo: 1 },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        { if: { leader: { state: 'active' } }, then: [{ do: { draw: 1 } }] },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit row): "[Monkey.D.Luffy]" is a Leader or Character of yours; the draw is gated on the Leader being active, not on a Luffy having been chosen ("Then, if" has its own condition)',
  ],
};
