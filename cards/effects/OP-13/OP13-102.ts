import type { CardScript } from '../../src/dsl.ts';

/** OP13-102 Edison. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_102: CardScript = {
  cardId: 'OP13-102',
  textHash: '12abde84845274',
  verified: {
    source: 'cards/overrides/OP13-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Trash this Character: if your Life <= opponent's, draw 1; then rest up to 1 of opponent's Characters with cost 3 or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              {
                life: 'opponent',
              },
            ],
          },
          then: [
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
                      lte: 3,
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
      ],
    },
    {
      id: 'trigger',
      label: "Draw 1 card and rest up to 1 of opponent's Characters with cost 3 or less",
      kind: 'trigger',
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
                  lte: 3,
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
  ],
};
