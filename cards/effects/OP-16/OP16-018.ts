import type { CardScript } from '../../src/dsl.ts';

/** OP16-018 Rockstar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_018: CardScript = {
  cardId: 'OP16-018',
  textHash: '04b77ced62b938',
  verified: {
    source: 'cards/overrides/OP16-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once Per Turn: if your {Red-Haired Pirates} Character would be K.O.'d, you may trash 1 Character card with 6000 power or more from your hand instead",
      kind: 'replacement',
      oncePerTurn: true,
      optional: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Red-Haired Pirates',
          },
        },
      },
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    gte: 6000,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
  ],
};
