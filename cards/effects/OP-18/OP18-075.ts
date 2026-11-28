import type { CardScript } from '../../src/dsl.ts';

/** OP18-075 Thousand Sunny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_075: CardScript = {
  cardId: 'OP18-075',
  textHash: '1ff2391a383912',
  verified: {
    source: 'cards/overrides/OP18-075.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { draw: 1 } }, { do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
    },
    {
      id: 'set-active',
      label:
        'DON!! −2, you may rest this Stage: set up to 1 of your {Straw Hat Crew} type Characters with 7000 power or less as active',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ donMinus: 2 }, { restSelf: true }],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ type: 'Straw Hat Crew' }, { power: { lte: 7000 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
