import type { CardScript } from '../../src/dsl.ts';

/** OP12-042 Alvida. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_042: CardScript = {
  cardId: 'OP12-042',
  textHash: '010db9ada0f13b',
  verified: {
    source: 'cards/overrides/OP12-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label:
        'With 2 or more Characters with a base cost of 5 or more, this Character gains +1 cost',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'characters', owner: 'you', filter: { baseCost: { gte: 5 } } } },
            '>=',
            2,
          ],
        },
      ],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 1 } }],
    },
    {
      id: 'on-play',
      label:
        "Place up to 1 of your opponent's Characters with a base cost of 1 or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { baseCost: { lte: 1 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: Alvida is base cost 4 and never counts toward her own condition; base cost is the printed cost (the +1 does not feed it); the Characters counted are your own',
  ],
};
