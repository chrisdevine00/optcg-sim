import type { CardScript } from '../../src/dsl.ts';

/** OP12-004 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_004: CardScript = {
  cardId: 'OP12-004',
  textHash: '07dca382c7086d',
  verified: {
    source: 'cards/overrides/OP12-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label: 'Reveal 2 Events: this Character gains +2000 power',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
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
