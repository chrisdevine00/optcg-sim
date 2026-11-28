import type { CardScript } from '../../src/dsl.ts';

/** OP18-015 Eyelashes. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_015: CardScript = {
  cardId: 'OP18-015',
  textHash: '117ab42b140eac',
  verified: {
    source: 'cards/overrides/OP18-015.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        "You may trash this Character: if your Leader has the {Alabasta} type, give up to 1 of your opponent's Leader or Characters -3000 power this turn",
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Alabasta',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3000,
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
    'reading: "If your Leader has the {Alabasta} type" has no colon before it, so it is an effect condition: the trash cost is paid even when the Leader is not {Alabasta}',
  ],
};
