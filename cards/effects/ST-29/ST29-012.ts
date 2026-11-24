import type { CardScript } from '../../src/dsl.ts';

/** ST29-012 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_012: CardScript = {
  cardId: 'ST29-012',
  textHash: '045f6d1362b82f',
  verified: {
    source: 'cards/overrides/ST29-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! card to 1 of your [Monkey.D.Luffy] cards',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Monkey.D.Luffy' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'reading: as OP14-005, the DON!! is given when one is rested and a [Monkey.D.Luffy] card exists (this Character is one itself)',
  ],
};
