import type { CardScript } from '../../src/dsl.ts';

/** PRB02-015 Shiryu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_015: CardScript = {
  cardId: 'PRB02-015',
  textHash: '1f43462b09fe71',
  verified: {
    source: 'cards/overrides/PRB02-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        'If your Leader has the "Blackbeard Pirates" type, this Character gains [Blocker] and +4 cost',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Blackbeard Pirates' } }],
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        { cost: { target: { from: 'self', owner: 'you' }, amount: 4 } },
      ],
    },
    {
      id: 'on-ko',
      label:
        'If your Leader has the "Blackbeard Pirates" type, K.O. up to 1 of your opponent\'s Characters with a base cost of 4 or less',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { baseCost: { lte: 4 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading: [Blocker] is gained, not printed (keywords stay empty); the +4 cost is a continuous cost change on the field, so it matters to effects that read this Character's cost",
  ],
};
