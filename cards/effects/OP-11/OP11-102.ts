import type { CardScript } from '../../src/dsl.ts';

/** OP11-102 Camie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_102: CardScript = {
  cardId: 'OP11-102',
  textHash: '0fb02a0eba7155',
  verified: {
    source: 'cards/overrides/OP11-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'watch',
      label:
        "[Your Turn] [Once Per Turn] When your opponent activates an Event or [Trigger]: if your opponent has 2 or more Life cards, trash 1 card from the top of each of your and your opponent's Life cards",
      kind: 'auto',
      optional: true,
      when: [
        { event: 'eventActivated', by: 'opponent' },
        { event: 'triggerActivated', by: 'opponent' },
      ],
      conditions: [{ yourTurn: true }],
      oncePerTurn: true,
      effect: [
        {
          if: { cmp: [{ life: 'opponent' }, '>=', 2] },
          then: [
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'any', pick: { exactly: 1 } },
                  to: { zone: 'trash' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G56, M6b-Q72): "activates an Event or [Trigger]" is one ability with two timings sharing the Once Per Turn; the [Trigger] counts when it is activated, not when the Life card is added to the hand; it resolves after the [Trigger] and the damage',
    'reading: the "If your opponent has 2 or more Life cards" has no colon before it, so it is an effect condition: the ability fires and the Once Per Turn is spent even when the opponent has fewer (DECISIONS 2026-11-24, B3A-R1); the Life count is read when the effect resolves, after the [Trigger]',
    "reading (G30): the Life cards go face up to the trash (not damage, no [Trigger]), yours first and then the opponent's; with no Life of your own only the opponent's is trashed",
  ],
};
