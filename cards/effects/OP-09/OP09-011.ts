import type { CardScript } from '../../src/dsl.ts';

/** OP09-011 Hongo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_011: CardScript = {
  cardId: 'OP09-011',
  textHash: '0e884760a16b7e',
  verified: {
    source: 'cards/overrides/OP09-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Rest this Character: if your Leader has the {Red-Haired Pirates} type, give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Red-Haired Pirates',
            },
          },
          then: [
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
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon, so it is an effect condition: the ability is used and this Character is rested even when the Leader has not the type (B3A-R1)',
  ],
};
