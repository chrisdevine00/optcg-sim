import type { CardScript } from '../../src/dsl.ts';

/** OP18-038 Shoot Down That Flag.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_038: CardScript = {
  cardId: 'OP18-038',
  textHash: '093caead30ab34',
  verified: {
    source: 'cards/overrides/OP18-038.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 [Sogeking] or {Straw Hat Crew} type card and add it to your hand; place the rest at the bottom in any order',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { any: [{ name: 'Sogeking' }, { type: 'Straw Hat Crew' }] },
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
    { id: 'trigger', label: 'Draw 1 card', kind: 'trigger', effect: [{ do: { draw: 1 } }] },
  ],
};
