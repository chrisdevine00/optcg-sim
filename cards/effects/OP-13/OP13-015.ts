import type { CardScript } from '../../src/dsl.ts';

/** OP13-015 Makino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_015: CardScript = {
  cardId: 'OP13-015',
  textHash: '070bdb83036b4e',
  verified: {
    source: 'cards/overrides/OP13-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Rest this Character: up to 1 of your [Monkey.D.Luffy] cards gains +2000 power',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
