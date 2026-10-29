import type { CardScript } from '../../src/dsl.ts';

/** OP17-042 Kaido. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_042: CardScript = {
  cardId: 'OP17-042',
  textHash: '0ac19e6d8ed90f',
  verified: {
    source: 'cards/overrides/OP17-042.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Give up to 1 of your opponent's Characters −3000 power",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Rocks Pirates',
            },
            pick: {
              exactly: 3,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
