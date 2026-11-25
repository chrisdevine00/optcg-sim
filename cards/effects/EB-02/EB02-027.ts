import type { CardScript } from '../../src/dsl.ts';

/** EB02-027 Vista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_027: CardScript = {
  cardId: 'EB02-027',
  textHash: '0279ad6fb1ec43',
  verified: {
    source: 'cards/overrides/EB02-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Place up to 1 of the opponent's Characters with 1000 power or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  power: {
                    lte: 1000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "1000 power or less" is the current power (a buff or given DON!! counts; a Character at 0 power qualifies), inclusive at 1000',
  ],
};
