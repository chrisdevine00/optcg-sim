import type { CardScript } from '../../src/dsl.ts';

/** OP13-044 Curiel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_044: CardScript = {
  cardId: 'OP13-044',
  textHash: '0168457a17c0c2',
  verified: {
    source: 'cards/overrides/OP13-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        'Give up to 1 rested DON!! card to your Leader or 1 Character with a type including "Whitebeard Pirates"',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { typeIncludes: 'Whitebeard Pirates' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
  ],
};
