import type { CardScript } from '../../src/dsl.ts';

/** ST33-005 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST33_005: CardScript = {
  cardId: 'ST33-005',
  textHash: '011da060533c98',
  verified: {
    source: 'cards/overrides/ST33-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Navy} type, play up to 1 blue {Navy} Character with 8000 power or less other than [Monkey.D.Garp] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ leader: { type: 'Navy' } }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { color: 'Blue' },
                    { type: 'Navy' },
                    { power: { lte: 8000 } },
                    { not: { name: 'Monkey.D.Garp' } },
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
};
