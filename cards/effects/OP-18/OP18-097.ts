import type { CardScript } from '../../src/dsl.ts';

/** OP18-097 Abyss Pentagram. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_097: CardScript = {
  cardId: 'OP18-097',
  textHash: '11662ebcf11f43',
  verified: {
    source: 'cards/overrides/OP18-097.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'discount',
      label:
        'With a {Celestial Dragons} Leader: playing {Holy Knights of God} or {Five Elders} Characters with a cost of 2 or more from your hand costs 1 less',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Celestial Dragons' } }],
      apply: [
        {
          playCost: {
            target: {
              from: 'hand',
              owner: 'you',
              filter: {
                all: [
                  { category: ['Character'] },
                  { any: [{ type: 'Holy Knights of God' }, { type: 'Five Elders' }] },
                  { cost: { gte: 2 } },
                ],
              },
            },
            amount: -1,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Draw 1 card and trash 2 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { draw: 1 } }, { do: { mill: { player: 'you', n: 2 } } }],
    },
  ],
  rulings: [
    'OP-18 wave G5: a permanent play-cost reduction; "a cost of 2 or more" reads the cost before the reduction, only plays from the hand by the rules are reduced, and the cost never goes below 0 (audit Q9)',
  ],
};
