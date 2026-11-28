import type { CardScript } from '../../src/dsl.ts';

/** OP18-028 Chimney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_028: CardScript = {
  cardId: 'OP18-028',
  textHash: '1058cee7af9252',
  verified: {
    source: 'cards/overrides/OP18-028.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may rest 1 of your [Gonbe] and this Character: set your [Monkey.D.Luffy] Leader as active',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          rest: {
            from: 'characters',
            owner: 'you',
            filter: {
              name: 'Gonbe',
            },
            pick: {
              exactly: 1,
            },
          },
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'leader',
              owner: 'you',
              filter: {
                name: 'Monkey.D.Luffy',
              },
            },
          },
        },
      ],
    },
  ],
};
