import type { CardScript } from '../../src/dsl.ts';

/** PRB02-012 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_012: CardScript = {
  cardId: 'PRB02-012',
  textHash: '0919876046fcb3',
  verified: {
    source: 'cards/overrides/PRB02-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 "Straw Hat Crew" card other than [Nami] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ type: 'Straw Hat Crew' }, { not: { name: 'Nami' } }] },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
};
