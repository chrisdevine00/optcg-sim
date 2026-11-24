import type { CardScript } from '../../src/dsl.ts';

/** OP16-106 Sanjuan.Wolf. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_106: CardScript = {
  cardId: 'OP16-106',
  textHash: '1836c654e48569',
  verified: {
    source: 'cards/overrides/OP16-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'With a {Blackbeard Pirates} Leader: draw 1, then up to 1 of your Leader or Characters has its base power become 7000 during this turn',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                setBasePower: {
                  target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
                  value: 7000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [On K.O.] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'onKO', of: 'self' } } }],
    },
  ],
  rulings: ['reading: "then" is inside the Leader-type if and does not depend on the draw'],
};
