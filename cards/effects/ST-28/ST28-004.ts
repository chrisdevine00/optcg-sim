import type { CardScript } from '../../src/dsl.ts';

/** ST28-004 Kouzuki Momonosuke. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST28_004: CardScript = {
  cardId: 'ST28-004',
  textHash: '1718f907e22421',
  verified: {
    source: 'cards/overrides/ST28-004.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'leader-boost',
      label: 'Your Turn: with 2 or less Life cards, your Leader gains +1000 power',
      kind: 'permanent',
      conditions: [{ yourTurn: true }, { cmp: [{ life: 'you' }, '<=', 2] }],
      apply: [{ power: { target: { from: 'leader', owner: 'you' }, amount: 1000 } }],
    },
    {
      id: 'activate-main',
      label:
        'Once Per Turn: you may return 2 total of your currently given DON!! cards to your cost area rested: this Character gains [Rush] and +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ returnGivenDon: 2 }],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: { target: { from: 'self', owner: 'you' }, amount: 1000, duration: 'thisTurn' },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q88): "2 total" of the DON!! given to your Leader and Characters in any split (including this Character); they go rested to the cost area, stay on the field and are not returned to the DON!! deck, so DON!! -N and "returned to the DON!! deck" watchers do not see them. The cost is part of the activation: it needs 2 given DON!!',
  ],
};
