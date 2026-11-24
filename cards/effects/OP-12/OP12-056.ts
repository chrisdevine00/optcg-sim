import type { CardScript } from '../../src/dsl.ts';

/** OP12-056 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_056: CardScript = {
  cardId: 'OP12-056',
  textHash: '016966c0b7bcf6',
  verified: {
    source: 'cards/overrides/OP12-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: play up to 1 blue {Navy} Character card with 8000 power or less other than [Monkey.D.Garp] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
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
  rulings: [
    'Reading: the trashed card is chosen first and cannot be the one played; the play is an unguarded up-to-1 pick (hidden-zone rule), asked even when nothing in hand qualifies; power is the printed power of the card in hand',
  ],
};
