import type { CardScript } from '../../src/dsl.ts';

/** OP11-114 Gum-Gum Fire-Fist Pistol Red Hawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_114: CardScript = {
  cardId: 'OP11-114',
  textHash: '01ae808b13ce5c',
  verified: {
    source: 'cards/overrides/OP11-114.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 3 DON!!: if you and your opponent have a total of 5 or more Life cards, K.O. up to 1 of your opponent's Characters with a base cost of 5 or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 3,
        },
      ],
      costOptional: true,
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'both',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 5,
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
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
