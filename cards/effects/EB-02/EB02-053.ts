import type { CardScript } from '../../src/dsl.ts';

/** EB02-053 Myskina Olga. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_053: CardScript = {
  cardId: 'EB02-053',
  textHash: '065188820a6e28',
  verified: {
    source: 'cards/overrides/EB02-053.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'look',
      label:
        "Look at up to 1 card from the top of your or your opponent's Life cards and place it at the top or bottom of the Life cards",
      kind: 'auto',
      when: ['onPlay', 'onKO'],
      effect: [
        {
          do: {
            lookAtLife: {
              owner: 'any',
              n: 1,
              place: 'topOrBottom',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (G64, M6b-Q81): "up to 1" lets you choose no Life area; the card is looked at, then placed at the top or bottom of the same Life area, keeping its face state; only you see it',
    'reading: [On Play]/[On K.O.] are one ability with two timings (no Once Per Turn on the text)',
  ],
};
