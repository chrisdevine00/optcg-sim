import type { CardScript } from '../../src/dsl.ts';

/** OP18-113 Rob Lucci. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_113: CardScript = {
  cardId: 'OP18-113',
  textHash: '0a0473b03122ae',
  verified: {
    source: 'cards/overrides/OP18-113.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'on-play-ko',
      label: "[On Play]/[On K.O.] Trash up to 1 card from the top of your opponent's Life cards",
      kind: 'auto',
      when: ['onPlay', 'onKO'],
      effect: [
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'trash' },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", draw 1 card and place up to 1 Character with a cost of 8 or less at the bottom of the owner\'s deck',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 8 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'deck', position: 'bottom' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
