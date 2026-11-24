import type { CardScript } from '../../src/dsl.ts';

/** ST29-008 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_008: CardScript = {
  cardId: 'ST29-008',
  textHash: '051a2e177caa21',
  verified: {
    source: 'cards/overrides/ST29-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "If your {Egghead} Character would be K.O.'d by your opponent's effect, you may turn 1 card from the top of your Life cards face-up instead",
      kind: 'replacement',
      replaces: {
        ko: { from: 'characters', owner: 'you', filter: { type: 'Egghead' } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ turnLifeFaceUp: 1 }],
    },
    {
      id: 'trigger',
      label: 'If your Leader is [Monkey.D.Luffy], play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { name: 'Monkey.D.Luffy' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    "reading: only a K.O. by the opponent's effect is replaced (a battle K.O., your own effect or a bounce is not); Nami is an {Egghead} and covers herself; not Once Per Turn, so every such K.O. may be replaced",
  ],
};
