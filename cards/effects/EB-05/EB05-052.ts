import type { CardScript } from '../../src/dsl.ts';

/** EB05-052 Gloriosa. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_052: CardScript = {
  cardId: 'EB05-052',
  textHash: '19c12899b1c9de',
  verified: {
    source: 'cards/overrides/EB05-052.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'damage-shield',
      label: 'If you would take damage, you may trash this Character instead',
      kind: 'replacement',
      replaces: { damage: 'you' },
      optional: true,
      instead: [{ trashSelf: true }],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 2 } },
        {
          do: {
            trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
          },
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q5/Q8 reading (m6b-wave2 D4): the damage does not happen at all, so no Life card is taken and no [Trigger] activates; one replacement covers a whole Double Attack hit; it is also offered when the hit would be taken at 0 Life',
    'reading: Gloriosa must be on the field to replace (it is a field ability); "Then" in the [Trigger] is a sequence: draw 2, then trash 1',
  ],
};
