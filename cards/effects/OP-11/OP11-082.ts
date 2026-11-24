import type { CardScript } from '../../src/dsl.ts';

/** OP11-082 Aramaki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_082: CardScript = {
  cardId: 'OP11-082',
  textHash: '17dde4295dd68f',
  verified: {
    source: 'cards/overrides/OP11-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Trash this Character: if your Leader has the "Navy" type, up to 1 "Navy" Character can also attack active Characters; then trash 2 cards from the top of your deck',
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
            leader: {
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                canAttackActive: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: {
                      type: 'Navy',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                mill: {
                  player: 'you',
                  n: 2,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, trash 2 cards from the top of your deck" is inside the Leader guard (M4b-5); Aramaki trashed as the cost is no longer on the field and cannot be chosen',
  ],
};
