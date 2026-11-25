import type { CardScript } from '../../src/dsl.ts';

/** OP12-075 Ms. All Sunday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_075: CardScript = {
  cardId: 'OP12-075',
  textHash: '177a09d443dc00',
  verified: {
    source: 'cards/overrides/OP12-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "K.O. up to 1 of your opponent's Characters with a cost of 3 or less; then your opponent may add 1 DON!! card from their DON!! deck and set it as active",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 3 } },
              pick: { upTo: 1 },
            },
          },
        },
        {
          chooseOne: [[{ do: { addDon: [{ n: 1, state: 'active' }], player: 'opponent' } }], []],
          chooser: 'opponent',
          labels: ['Add 1 DON!! (active)', 'Do not add'],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'DON!! -1: play this card',
      kind: 'trigger',
      cost: [{ donMinus: 1 }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'reading (G51, M6b-Q75): "Then, your opponent may add ..." is a plain sequence, not "If you do": the opponent is asked whether to add the DON!! even when nothing was K.O.\'d; they choose, the DON!! comes from their own DON!! deck and is active, and with an empty DON!! deck nothing is added',
    'reading: the [Trigger] needs the DON!! -1 paid (it is not offered with no DON!! on the field); an activated [Trigger] plays this card from the Life area',
  ],
};
