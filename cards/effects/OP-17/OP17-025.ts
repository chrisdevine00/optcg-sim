import type { CardScript } from '../../src/dsl.ts';

/** OP17-025 Building Snake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_025: CardScript = {
  cardId: 'OP17-025',
  textHash: '01fcb9ba9d32a2',
  verified: {
    source: 'cards/overrides/OP17-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 6,
                    },
                  },
                ],
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
      id: 'give-don',
      label: 'Give up to 1 rested DON!! card to your [Shanks] Leader',
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
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Shanks',
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
