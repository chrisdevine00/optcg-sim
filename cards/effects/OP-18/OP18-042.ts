import type { CardScript } from '../../src/dsl.ts';

/** OP18-042 Hack. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_042: CardScript = {
  cardId: 'OP18-042',
  textHash: '06725ab7ac86cc',
  verified: {
    source: 'cards/overrides/OP18-042.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-ko',
      label: '[On K.O.] Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! card to 1 of your {Dressrosa} type Leader or Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Dressrosa' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP12-031): the target is exactly 1 card and the DON!! is "up to 1", so with no rested DON!! nothing moves; Hack may give to itself',
  ],
};
