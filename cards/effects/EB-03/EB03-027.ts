import type { CardScript } from '../../src/dsl.ts';

/** EB03-027. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_027: CardScript = {
  cardId: 'EB03-027',
  textHash: '0f98195c568702',
  verified: {
    source: 'cards/overrides/EB03-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Return up to 1 Character with 7000 base power to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  basePower: {
                    eq: 7000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: exactly 7000 base power on either side, this Marguerite included (7000)'],
};
