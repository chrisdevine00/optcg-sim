import type { CardScript } from '../../src/dsl.ts';

/** ST21-017 Gum-Gum Mole Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_017: CardScript = {
  cardId: 'ST21-017',
  textHash: '0077e9644d681d',
  verified: {
    source: 'cards/overrides/ST21-017.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Give up to 1 opposing Character -5000 power; then, with a 6000-power Character, K.O. one with 2000 power or less',
      kind: 'activate',
      when: 'main',
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
              amount: -5000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                power: {
                  gte: 6000,
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
                    power: {
                      lte: 2000,
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
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: the K.O. step reads power after the -5000 has been applied, so the -5000 may bring the target to 2000 or less',
    'Read: "Then, if you have ..." is one condition on the K.O.; the -5000 itself is not required to have happened',
  ],
};
