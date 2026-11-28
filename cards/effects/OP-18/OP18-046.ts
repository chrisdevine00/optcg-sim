import type { CardScript } from '../../src/dsl.ts';

/** OP18-046 Mr.0 & Ms. All Sunday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_046: CardScript = {
  cardId: 'OP18-046',
  textHash: '07bd1aff8dd18d',
  verified: {
    source: 'cards/overrides/OP18-046.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 2 cards and give your Leader and all of your Characters up to 2 rested DON!! cards each',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              each: true,
              to: { from: ['leader', 'characters'], owner: 'you' },
            },
          },
        },
      ],
    },
    {
      id: 'opp-attack',
      label:
        'You may trash 1 card from your hand: the base power of your Leader with a type including "Baroque Works" becomes 7000 during this turn',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            setBasePower: {
              target: { from: 'leader', owner: 'you', filter: { typeIncludes: 'Baroque Works' } },
              value: 7000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit row): "each" gives each target up to 2 rested DON!! (the engine asks a count when more than 1 can go); with fewer rested DON!! than targets the player picks which cards get one',
    "reading: the base power change lasts the whole turn it is made (the opponent's turn), a Leader without a Baroque Works type is not affected and the cost is still paid",
  ],
};
