import type { CardScript } from '../../src/dsl.ts';

/** OP16-024 Inazuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_024: CardScript = {
  cardId: 'OP16-024',
  textHash: '0f07360c642ce9',
  verified: {
    source: 'cards/overrides/OP16-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'ko-by-effect',
      label: "When K.O.'d by your opponent's effect, rest up to 1 of your opponent's Characters",
      kind: 'auto',
      when: ['onKO'],
      conditions: [{ koCause: 'opponentEffect' }],
      effect: [{ do: { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } } }],
    },
  ],
  rulings: [
    'reading: "K.O.\'d by your opponent\'s effect" is an effect of the other player (a cost of theirs included, CR 8-1-1); a battle K.O. or a K.O. by your own effect does not trigger it',
  ],
};
