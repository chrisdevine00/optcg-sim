import type { CardScript } from '../../src/dsl.ts';

/** EB03-042 Koala. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_042: CardScript = {
  cardId: 'EB03-042',
  textHash: '0366d78174112a',
  verified: {
    source: 'cards/overrides/EB03-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-up',
      label: 'If your Leader has the {Revolutionary Army} type, this Character gains +4 cost',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Revolutionary Army' } }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 4 } }],
    },
    {
      id: 'on-ko',
      label:
        "Opponent's turn, on K.O.: play up to 1 {Revolutionary Army} Character (cost 6 or less, not Koala) or [Nico Robin] (cost 6 or less) from your hand or trash",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: ['hand', 'trash'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      all: [
                        { category: ['Character'] },
                        { type: 'Revolutionary Army' },
                        { cost: { lte: 6 } },
                        { not: { name: 'Koala' } },
                      ],
                    },
                    {
                      all: [
                        { category: ['Character'] },
                        { name: 'Nico Robin' },
                        { cost: { lte: 6 } },
                      ],
                    },
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
  rulings: [
    'Reading: one pick covers both alternatives ("up to 1 ... or up to 1 [Nico Robin]"), from hand and trash together; at most one card is played in total',
  ],
};
