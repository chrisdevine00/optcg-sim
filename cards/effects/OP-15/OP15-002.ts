import type { CardScript } from '../../src/dsl.ts';

/** OP15-002 Lucy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_002: CardScript = {
  cardId: 'OP15-002',
  textHash: '05083d06b40102',
  verified: {
    source: 'cards/overrides/OP15-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'battle-trash',
      label:
        'Trash any number of Event or Stage cards from your hand; +1000 power for each during this battle',
      kind: 'auto',
      when: ['whenAttacking', 'onOpponentAttack'],
      effect: [
        {
          if: { exists: { from: 'hand', owner: 'you', filter: { category: ['Event', 'Stage'] } } },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  filter: { category: ['Event', 'Stage'] },
                  pick: { any: true },
                  bind: 'trashed',
                },
              },
            },
            {
              do: {
                power: {
                  target: { from: 'leader', owner: 'you' },
                  amount: { mul: [{ refCount: 'trashed' }, 1000] },
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'draw',
      label: 'If you have activated an Event with a base cost of 3 or more this turn, draw 1 card',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: { eventsActivatedThisTurn: 'you', baseCost: { gte: 3 } },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: "You may trash any number" is the pick itself (choosing none is the decline), so there is no separate accept prompt; the bonus is +1000 times the cards actually trashed, +0 for none',
    'reading: "activated an Event with a base cost of 3 or more" reads the Event\'s printed cost when it is activated from hand ([Main] or [Counter], M6b-Q31 family); the "If" is an effect condition (no colon before it), so the Once Per Turn is spent even when it is false',
  ],
};
