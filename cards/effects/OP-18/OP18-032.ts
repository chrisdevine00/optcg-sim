import type { CardScript } from '../../src/dsl.ts';

/** OP18-032 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_032: CardScript = {
  cardId: 'OP18-032',
  textHash: '195a689b3add95',
  verified: {
    source: 'cards/overrides/OP18-032.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play-ko',
      label:
        "[On Play]/[On K.O.] Up to 1 of your opponent's rested Characters with 8000 power or less will not become active in your opponent's next Refresh Phase",
      kind: 'auto',
      when: ['onPlay', 'onKO'],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: { all: [{ state: 'rested' }, { power: { lte: 8000 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "8000 power or less" is current power (given DON!! and modifiers count), read when the effect resolves',
  ],
};
