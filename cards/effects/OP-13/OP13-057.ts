import type { CardScript } from '../../src/dsl.ts';

/** OP13-057 If I Bowed Down to Power, What's the Point in Living?. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_057: CardScript = {
  cardId: 'OP13-057',
  textHash: '0e14f66d16c9a7',
  verified: {
    source: 'cards/overrides/OP13-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 of your DON!! cards: if you have 1 or less Life cards, your opponent cannot activate [Blocker] whenever your Leader attacks during this turn',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 1 }],
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 1] },
          then: [
            {
              do: {
                restrict: {
                  target: { from: 'leader', owner: 'you' },
                  what: 'cannotActivateBlockerAgainstIt',
                  duration: 'thisTurn',
                },
              },
            },
          ],
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
};
