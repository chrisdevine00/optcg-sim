import type { CardScript } from '../../src/dsl.ts';

/** OP12-069 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_069: CardScript = {
  cardId: 'OP12-069',
  textHash: '1d73edc059f22e',
  verified: {
    source: 'cards/overrides/OP12-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter-boost',
      label:
        "DON!! -1: if your Leader's type includes {Baroque Works}, up to 1 of your Leader or Character cards gains +2000 power during this battle",
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ donMinus: 1 }],
      effect: [
        {
          if: { leader: { typeIncludes: 'Baroque Works' } },
          then: [
            {
              do: {
                power: {
                  target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (RL-52): the DON!! -1 is optional; the Leader condition follows the colon, so the DON!! is returned (and the Once Per Turn used) even when the Leader has no {Baroque Works} type; "type includes" is a substring of a type element',
  ],
};
