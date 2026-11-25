import type { CardScript } from '../../src/dsl.ts';

/** OP09-027 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_027: CardScript = {
  cardId: 'OP09-027',
  textHash: '07eb395e08a3be',
  verified: {
    source: 'cards/overrides/OP09-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'Once per turn: if you have 3 or more rested Characters, draw 1 card',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              3,
            ],
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
  rulings: [
    'reading: no colon, so an effect condition (the ability fires and Once Per Turn is spent with fewer than 3); the attacking Sabo is rested and counts himself',
  ],
};
