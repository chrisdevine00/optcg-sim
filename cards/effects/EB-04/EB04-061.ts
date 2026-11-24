import type { CardScript } from '../../src/dsl.ts';

/** EB04-061 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_061: CardScript = {
  cardId: 'EB04-061',
  textHash: '134e99efa284c2',
  verified: {
    source: 'cards/overrides/EB04-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -1 cost if you have 1 or less Life cards',
      kind: 'permanent',
      zone: 'hand',
      conditions: [{ cmp: [{ life: 'you' }, '<=', 1] }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -1 } }],
    },
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: your Leader gains +2000 power, then this Character gains [Blocker], until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: 2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Blocker',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, this Character gains [Blocker]" is not "If you do": both follow the paid cost',
  ],
};
