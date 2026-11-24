import type { CardScript } from '../../src/dsl.ts';

/** OP11-013 Prince Grus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_013: CardScript = {
  cardId: 'OP11-013',
  textHash: '1f57c1c2787677',
  verified: {
    source: 'cards/overrides/OP11-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack-lock',
      label:
        "All of your opponent's Characters with 2000 power or less cannot activate [Blocker] this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  power: {
                    lte: 2000,
                  },
                },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Characters are fixed when the effect resolves (current power then, a snapshot); a Character that later drops to 2000 or less, or is played afterwards, can still block',
  ],
};
