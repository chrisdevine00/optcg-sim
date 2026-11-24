import type { CardScript } from '../../src/dsl.ts';

/** EB05-005 Belo Betty. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_005: CardScript = {
  cardId: 'EB05-005',
  textHash: '1680077f3cc74f',
  verified: {
    source: 'cards/overrides/EB05-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Up to 3 of your Characters with both the {Revolutionary Army} type and a [Trigger] gain +2000 power during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'Revolutionary Army',
                    },
                    {
                      hasTrigger: true,
                    },
                  ],
                },
                pick: {
                  upTo: 3,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'debuff',
      label:
        "You may trash this Character: give up to 1 of your opponent's Characters -2000 power during this turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
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
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the trash-self cost of a non-Event [Activate: Main] is part of the activation (B-1); the card is gone even if the opponent has no Character to target',
    'reading: "a [Trigger]" is the printed Trigger line (`hasTrigger`)',
  ],
};
