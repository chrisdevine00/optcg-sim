import type { CardScript } from '../../src/dsl.ts';

/** ST29-016 Kizaru!! Compared to Two Years Ago We're a Hundred Times Stronger Now!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_016: CardScript = {
  cardId: 'ST29-016',
  textHash: '09a424e8c9a70a',
  verified: {
    source: 'cards/overrides/ST29-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Your [Monkey.D.Luffy] Leader gains [Unblockable] during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            grant: {
              target: { from: 'leader', owner: 'you', filter: { name: 'Monkey.D.Luffy' } },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the [Main] does nothing unless your Leader is named [Monkey.D.Luffy]; the [Counter] has no name restriction',
  ],
};
