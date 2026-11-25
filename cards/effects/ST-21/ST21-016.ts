import type { CardScript } from '../../src/dsl.ts';

/** ST21-016 Gum-Gum Dawn Whip. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_016: CardScript = {
  cardId: 'ST21-016',
  textHash: '1b3423d2a987ea',
  verified: {
    source: 'cards/overrides/ST21-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Up to 1 of your Leader or Character cards gains +1000 power during this turn; then up to 1 of your opponent's Characters with 4000 power or less cannot activate [Blocker] during this turn",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { power: { lte: 4000 } },
                pick: { upTo: 1 },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { power: { lte: 4000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the second half resolves even when no +1000 target was picked; the 4000 power is the current power when the target is chosen (a snapshot); the +1000 does not change what the Blocker target must be',
  ],
};
