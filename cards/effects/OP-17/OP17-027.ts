import type { CardScript } from '../../src/dsl.ts';

/** OP17-027 Benn.Beckman. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_027: CardScript = {
  cardId: 'OP17-027',
  textHash: '03998383429e82',
  verified: {
    source: 'cards/overrides/OP17-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush: Character'],
  abilities: [
    {
      id: 'on-play',
      label:
        "With a {Red-Haired Pirates} Leader, draw 1 card and rest up to 2 of your opponent's Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Red-Haired Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['reading: one sentence, so both the draw and the rest are inside the Leader-type "if"'],
};
