import type { CardScript } from '../../src/dsl.ts';

/** OP12-096 Ursa Shock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_096: CardScript = {
  cardId: 'OP12-096',
  textHash: '1ba723d4094e44',
  verified: {
    source: 'cards/overrides/OP12-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "K.O. up to 1 of your opponent's Characters with cost 4 or less (6 or less if you have a Character with cost 8 or more)",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                cost: {
                  gte: 8,
                },
              },
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 6,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
          else: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 4,
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
      label: 'Draw 1 card and trash 1 card from the top of your deck',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: 1,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q8: "you may select ... cost 6 or less instead": with a cost-8 Character any opposing Character of cost 6 or less is a legal pick (a superset of cost 4 or less), so the choice is the condition',
  ],
};
