import type { CardScript } from '../../src/dsl.ts';

/** ST35-005 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST35_005: CardScript = {
  cardId: 'ST35-005',
  textHash: '1ae4f986253053',
  verified: {
    source: 'cards/overrides/ST35-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'static',
      label: 'This Character gains +3 cost',
      kind: 'permanent',
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 3 } }],
    },
    {
      id: 'on-play',
      label:
        'Give up to 1 rested DON!! to your Leader; play up to 1 {Revolutionary Army} Character with 4000 power or less from your hand or trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { giveDon: { n: 1, state: 'rested', to: { from: 'leader', owner: 'you' } } } },
        {
          do: {
            play: {
              what: {
                from: ['hand', 'trash'],
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { power: { lte: 4000 } },
                    { type: 'Revolutionary Army' },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, play" is not "If you do": the play step happens whether or not a DON!! card was given',
  ],
};
