import type { CardScript } from '../../src/dsl.ts';

/** OP17-071 Who's.Who. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_071: CardScript = {
  cardId: 'OP17-071',
  textHash: '185ccc4c44df41',
  verified: {
    source: 'cards/overrides/OP17-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "DON!! -1: K.O. up to 2 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 2 } },
              pick: { upTo: 2 },
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
