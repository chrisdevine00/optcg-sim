import type { CardScript } from '../../src/dsl.ts';

/** OP18-022 Monkey.D.Luffy (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_022: CardScript = {
  cardId: 'OP18-022',
  textHash: '105efb9f54403f',
  verified: {
    source: 'cards/overrides/OP18-022.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'set-active',
      label:
        'You may set this Leader as active; if you do, it will not become active in your next Refresh Phase',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      conditions: [
        {
          donGiven: 3,
        },
      ],
      effect: [
        {
          may: [
            {
              do: {
                setActive: {
                  from: 'leader',
                  owner: 'you',
                },
              },
            },
          ],
          label: 'set',
        },
        {
          ifDid: 'set',
          then: [
            {
              do: {
                skipRefresh: {
                  from: 'leader',
                  owner: 'you',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Q15 proposed reading (m6b-audit OP-18): the Leader attacking is rested, becomes active, and the Refresh skip is a modifier that ends after your next Refresh Phase whether or not the Leader is rested then',
  ],
};
