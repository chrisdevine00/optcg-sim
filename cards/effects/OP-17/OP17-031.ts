import type { CardScript } from '../../src/dsl.ts';

/** OP17-031 Yasopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_031: CardScript = {
  cardId: 'OP17-031',
  textHash: '0a44266c26b598',
  verified: {
    source: 'cards/overrides/OP17-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Draw 1 card and rest up to 1 of your opponent's Characters with a cost of 8 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 8,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'end-turn',
      label: 'Set up to 1 of your Characters with a type including "Red-Haired Pirates" as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                typeIncludes: 'Red-Haired Pirates',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
