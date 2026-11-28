import type { CardScript } from '../../src/dsl.ts';

/** OP18-119 Saint Shamrock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_119: CardScript = {
  cardId: 'OP18-119',
  textHash: '12f5e6c31944c2',
  verified: {
    source: 'cards/overrides/OP18-119.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'on-ko',
      label: 'You may trash 1 card from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            play: {
              what: { from: 'trash', owner: 'you', filter: { isSelf: true }, pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
    {
      id: 'play-holy-knight',
      label:
        'If this Character was played on this turn, play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ isSelf: true }, { playedThisTurn: true }] },
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Holy Knights of God' },
                        { cost: { lte: 6 } },
                      ],
                    },
                    pick: { upTo: 1 },
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
