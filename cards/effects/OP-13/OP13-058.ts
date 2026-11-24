import type { CardScript } from '../../src/dsl.ts';

/** OP13-058 Phoenix Pyreapple. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_058: CardScript = {
  cardId: 'OP13-058',
  textHash: '12400ae7f2e2bf',
  verified: {
    source: 'cards/overrides/OP13-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 1 of your DON!! cards: place up to 1 of the opponent's Characters with 3000 power or less at the bottom of the owner's deck",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 1 }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { power: { lte: 3000 } },
                pick: { upTo: 1 },
              },
              to: { zone: 'deck', position: 'bottom' },
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
};
