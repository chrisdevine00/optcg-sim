import type { CardScript } from '../../src/dsl.ts';

/** OP12-022 Inuarashi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_022: CardScript = {
  cardId: 'OP12-022',
  textHash: '0edfc2ab5c87c4',
  verified: {
    source: 'cards/overrides/OP12-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Rest this Character: up to 1 of your opponent's rested Characters with cost 5 or less will not become active in their next Refresh Phase",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 5,
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
  ],
};
