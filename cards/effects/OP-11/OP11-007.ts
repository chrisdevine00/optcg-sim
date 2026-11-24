import type { CardScript } from '../../src/dsl.ts';

/** OP11-007 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_007: CardScript = {
  cardId: 'OP11-007',
  textHash: '1e82c3a0e33639',
  verified: {
    source: 'cards/overrides/OP11-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label:
        'You may rest this Character: if your Leader has the {Navy} type, up to 1 of your {Navy} Characters gains +2000 power this turn',
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
              type: 'Navy',
            },
          },
          then: [
            {
              do: {
                power: {
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
                  amount: 2000,
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
    'reading: the "If your Leader has the Navy type" follows the colon, so it is an effect condition: the rest cost is paid even with a non-Navy Leader and the effect does nothing (not an activation condition); Tashigi may target herself while rested',
  ],
};
