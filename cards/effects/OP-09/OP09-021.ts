import type { CardScript } from '../../src/dsl.ts';

/** OP09-021 Red Force. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_021: CardScript = {
  cardId: 'OP09-021',
  textHash: '096b8d48fb9ad1',
  verified: {
    source: 'cards/overrides/OP09-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "Rest this Stage: with a Red-Haired Pirates Leader, give up to 1 of your opponent's Characters -1000 power this turn",
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
                  amount: -1000,
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
    'reading: the "If" is after the cost colon, so it is an effect condition: with another Leader the Stage still rests and nothing happens',
  ],
};
