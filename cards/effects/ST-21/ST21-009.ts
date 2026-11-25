import type { CardScript } from '../../src/dsl.ts';

/** ST21-009 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_009: CardScript = {
  cardId: 'ST21-009',
  textHash: '1914aeb1ba4a69',
  verified: {
    source: 'cards/overrides/ST21-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Give up to 2 rested DON!! cards to 1 of your {Straw Hat Crew} type Leader or Character cards',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Straw Hat Crew' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2" asks a count; the target must have the {Straw Hat Crew} type (Nami herself, the Leader or another Character); with no such target nothing is given',
  ],
};
