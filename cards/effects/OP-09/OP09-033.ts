import type { CardScript } from '../../src/dsl.ts';

/** OP09-033 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_033: CardScript = {
  cardId: 'OP09-033',
  textHash: '0c3689da682967',
  verified: {
    source: 'cards/overrides/OP09-033.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested Characters, none of your {ODYSSEY} or {Straw Hat Crew} type Characters can be K.O.'d by effects until the end of your opponent's next turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              { count: { from: 'characters', owner: 'you', filter: { state: 'rested' } } },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { any: [{ type: 'ODYSSEY' }, { type: 'Straw Hat Crew' }] },
                  },
                  what: { cannotBeKOd: { cause: 'effect' } },
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the quoted "ODYSSEY" and "Straw Hat Crew" are exact types ({X}); Robin herself is both, but she is just played and active, so she is not one of the 2 rested Characters yet she is protected',
    'reading: the "If" has no colon, so it is an effect condition read when the effect resolves; with fewer than 2 rested Characters the ability fires and nothing happens',
    'reading: "by effects" is an effect of either player (a cost included, RL-16), so your own K.O. is stopped too; battle K.O.s are not; the protection is given to the Characters on the field at resolution (a Character played later gets none) and lasts until the end of the opponent\'s next turn',
  ],
};
