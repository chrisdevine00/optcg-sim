import type { CardScript } from '../../src/dsl.ts';

/** OP18-078 Mini-Merry. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_078: CardScript = {
  cardId: 'OP18-078',
  textHash: '06d470344f6dee',
  verified: {
    source: 'cards/overrides/OP18-078.json (official OP-18 card list, card text in cards/data)',
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
      id: 'give-don',
      label:
        'You may rest this Stage: give up to a total of 4 of your Leader or Characters 1 rested DON!! card each',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              each: true,
              to: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 4 } },
            },
          },
        },
      ],
    },
  ],
};
