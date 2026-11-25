import type { CardScript } from '../../src/dsl.ts';

/** ST17-005 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST17_005: CardScript = {
  cardId: 'ST17-005',
  textHash: '0b597c7a20e8ef',
  verified: {
    source: 'cards/overrides/ST17-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Once per turn: you may place 1 card from your hand at the top of your deck: give up to 2 rested DON!! cards to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'top' },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read (as OP12-013): "up to 2" asks a count (None, 1 or 2) when 2 or more rested DON!! can be given, then one target among the Leader and Characters; the cost is paid even with no rested DON!!',
  ],
};
