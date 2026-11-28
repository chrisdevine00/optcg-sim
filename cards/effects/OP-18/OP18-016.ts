import type { CardScript } from '../../src/dsl.ts';

/** OP18-016 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_016: CardScript = {
  cardId: 'OP18-016',
  textHash: '13f911a031a7a7',
  verified: {
    source: 'cards/overrides/OP18-016.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Banish'],
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 {Alabasta} Character with 6000 power or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Alabasta',
                    },
                    {
                      power: {
                        lte: 6000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
