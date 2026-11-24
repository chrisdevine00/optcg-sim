import type { CardScript } from '../../src/dsl.ts';

/** OP15-057 Dressrosa Kingdom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_057: CardScript = {
  cardId: 'OP15-057',
  textHash: '05bc1b23e67b5c',
  verified: {
    source: 'cards/overrides/OP15-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has the {Dressrosa} type, draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Dressrosa',
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
    {
      id: 'opp-attack',
      label:
        'You may rest this Stage and trash 1 Event or Stage from your hand: up to 1 of your Leader or Characters gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [
        {
          restSelf: true,
        },
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event', 'Stage'],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
