import type { CardScript } from '../../src/dsl.ts';

/** OP18-077 White Hobby Horse 1. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_077: CardScript = {
  cardId: 'OP18-077',
  textHash: '1fc1e2ecc99c50',
  verified: {
    source: 'cards/overrides/OP18-077.json (official OP-18 card list, card text in cards/data)',
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
      id: 'rush',
      label:
        'You may rest this Stage: up to 1 of your {Straw Hat Crew} type Characters gains [Rush: Character] during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { type: 'Straw Hat Crew' },
                pick: { upTo: 1 },
              },
              keyword: 'Rush: Character',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
