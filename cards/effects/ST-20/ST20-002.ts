import type { CardScript } from '../../src/dsl.ts';

/** ST20-002 Charlotte Cracker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST20_002: CardScript = {
  cardId: 'ST20-002',
  textHash: '1887455a6f8597',
  verified: {
    source: 'cards/overrides/ST20-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-shield',
      label:
        "If this Character would be K.O.'d by an effect, you may trash 1 card from the top of your Life cards instead",
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        ko: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'effect',
      },
      instead: [{ trashLife: 1 }],
    },
    {
      id: 'trigger',
      label: 'You may trash 1 card from your hand: play this card',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    'reading (G11, G30): "by an effect" is an effect of either player, a cost included, and not a battle K.O.; the Life card is trashed face up as a payload (not damage, no [Trigger]); with no Life the replacement is not offered and the K.O. happens; the K.O. does not happen when the replacement is used',
  ],
};
