import type { CardScript } from '../../src/dsl.ts';

/** OP09-019 Nobody Hurts a Friend of Mine!!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_019: CardScript = {
  cardId: 'OP09-019',
  textHash: '0a918b669c6469',
  verified: {
    source: 'cards/overrides/OP09-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        '[Main] With a Red-Haired Pirates Leader, an opposing Character gets -3000 power this turn; then, if the opponent has a Character with 5000 or more power, draw 1',
      kind: 'activate',
      when: 'main',
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
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
            {
              if: {
                exists: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      gte: 5000,
                    },
                  },
                },
              },
              then: [
                {
                  do: {
                    draw: 1,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then, if your opponent has a Character with 5000 or more power" follows the Leader "If", so it sits inside that guard; it is read after the -3000 was applied (current power), and holds even when no Character was chosen ("up to")',
  ],
};
