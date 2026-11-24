import type { CardScript } from '../../src/dsl.ts';

/** OP17-021 Crone Oil. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_021: CardScript = {
  cardId: 'OP17-021',
  textHash: '19d84a8cd32193',
  verified: {
    source: 'cards/overrides/OP17-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rest-shield',
      label:
        'If your Character with a type including "Red-Haired Pirates" would be removed from the field by your opponent\'s effect, you may rest 1 of your cards instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            typeIncludes: 'Red-Haired Pirates',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
  ],
};
