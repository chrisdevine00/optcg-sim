import type { CardScript } from '../../src/dsl.ts';

/** OP12-024 Gyukimaru. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_024: CardScript = {
  cardId: 'OP12-024',
  textHash: '149d56637c5a21',
  verified: {
    source: 'cards/overrides/OP12-024.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label:
        "If this Character is active, this Character cannot be K.O.'d by your opponent's effects",
      kind: 'permanent',
      conditions: [{ self: { state: 'active' } }],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'opponentEffect' } },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        "[When Attacking] If you have a total of 3 or more given DON!! cards, rest up to 1 of your opponent's Characters with a base cost of 6 or less",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: { cmp: [{ donGiven: 'you' }, '>=', 3] },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { baseCost: { lte: 6 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading: the protection is live and needs Gyukimaru to be active (a rested one can be K.O.'d by an opposing effect); it covers your opponent's effects only",
    'reading: "a total of 3 or more given DON!! cards" counts the DON!! given to your Leader and all your Characters together, read when the effect resolves; the "If" has no colon, so it is an effect condition (the ability fires and nothing happens below 3); the target\'s BASE cost is read (6 is in, 7 is out)',
  ],
};
