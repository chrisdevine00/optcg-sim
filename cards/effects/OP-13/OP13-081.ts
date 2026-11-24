import type { CardScript } from '../../src/dsl.ts';

/** OP13-081 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_081: CardScript = {
  cardId: 'OP13-081',
  textHash: '111e65b9db398b',
  verified: {
    source: 'cards/overrides/OP13-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label: 'With a "Revolutionary Army" Leader, this Character gains +3 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Revolutionary Army',
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3,
          },
        },
      ],
    },
    {
      id: 'give-don',
      label:
        'You may place 1 card from your trash at the bottom of your deck: give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader has the "Revolutionary Army" type = the exact type element; the Activate\'s cost is a single card from the trash (nothing to order), and it is not offered with an empty trash; the DON!! given is a rested cost-area DON!!, as OP14-005 (up to 1 with n 1: no count asked)',
  ],
};
