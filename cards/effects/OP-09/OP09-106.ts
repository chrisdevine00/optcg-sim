import type { CardScript } from '../../src/dsl.ts';

/** OP09-106 Nico Olvia. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_106: CardScript = {
  cardId: 'OP09-106',
  textHash: '139dcd38b13aa8',
  verified: {
    source: 'cards/overrides/OP09-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Up to 1 of your [Nico Robin] Leader gains +3000 power during this turn',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Nico Robin',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      kind: 'trigger',
      label: 'If your Leader is [Nico Robin], draw 3 cards and trash 2 cards from your hand',
      effect: [
        {
          if: {
            leader: {
              name: 'Nico Robin',
            },
          },
          then: [
            {
              do: {
                draw: 3,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
