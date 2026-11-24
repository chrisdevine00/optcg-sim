import type { CardScript } from '../../src/dsl.ts';

/** OP17-034 Rockstar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_034: CardScript = {
  cardId: 'OP17-034',
  textHash: '003b789ebfe1fc',
  verified: {
    source: 'cards/overrides/OP17-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rockstar',
      label:
        "With an opponent's Leader of 6000 power or more: set up to 1 DON!! as active; then your {Red-Haired Pirates} Leader's base power becomes 6000",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          exists: {
            from: 'leader',
            owner: 'opponent',
            filter: {
              power: {
                gte: 6000,
              },
            },
          },
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            setBasePower: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  type: 'Red-Haired Pirates',
                },
              },
              value: 6000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" opens the whole ability (activation condition), so the DON!! step and the base power step are both gated; "Then" adds no further condition (block5 Q10)',
  ],
};
