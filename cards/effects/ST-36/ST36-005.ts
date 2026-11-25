import type { CardScript } from '../../src/dsl.ts';

/** ST36-005 Eustass"Captain"Kid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST36_005: CardScript = {
  cardId: 'ST36-005',
  textHash: '1837bd95faac18',
  verified: {
    source: 'cards/overrides/ST36-005.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-opponent-attack',
      label:
        'You may turn 1 card from the top or bottom of your Life cards face-down: change the target of the attack to your [Eustass"Captain"Kid] with 5000 base power or more',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ turnLifeFaceDown: { n: 1, from: 'topOrBottom' } }],
      effect: [
        {
          do: {
            redirectAttack: {
              to: {
                from: 'characters',
                owner: 'you',
                filter: { all: [{ name: 'Eustass"Captain"Kid' }, { basePower: { gte: 5000 } }] },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
    {
      id: 'activate-main',
      label:
        'Once Per Turn: you may turn 1 card from the top or bottom of your Life cards face-up: give up to 1 rested DON!! to your Leader',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ turnLifeFaceUp: { n: 1, from: 'topOrBottom' } }],
      effect: [
        { do: { giveDon: { n: 1, state: 'rested', to: { from: 'leader', owner: 'you' } } } },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q86): "top or bottom" lets the player choose either end whose card is in the needed face state (face-up to turn down, face-down to turn up); an end already in the target state is not payable (M6b-Q59). The choice of end is public',
    'Reading: "your [Eustass"Captain"Kid] with 5000 base power or more" may be this Character or another copy on your field, active or rested (QA-EB01 EB01-029); the Leader is not a Character',
    'Reading: the redirect target is asked among matching Characters; the cost is paid first, so with no matching Character the Life card is already turned',
  ],
};
