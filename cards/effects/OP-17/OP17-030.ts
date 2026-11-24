import type { CardScript } from '../../src/dsl.ts';

/** OP17-030 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_030: CardScript = {
  cardId: 'OP17-030',
  textHash: '1a3881b72afd53',
  verified: {
    source: 'cards/overrides/OP17-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may rest 1 of your DON!! cards: this Character gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'don-active',
      label: 'With 5 or less cards in your hand, set up to 1 of your DON!! cards as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          cmp: [
            {
              hand: 'you',
            },
            '<=',
            5,
          ],
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
      ],
    },
  ],
  rulings: [
    'reading: "If you have 5 or less cards in your hand" is an activation condition (EB04-007 reading): with 6 or more the ability cannot be activated and Once Per Turn is not spent',
  ],
};
