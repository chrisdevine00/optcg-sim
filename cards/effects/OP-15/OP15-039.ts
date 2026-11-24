import type { CardScript } from '../../src/dsl.ts';

/** OP15-039 Rebecca. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_039: CardScript = {
  cardId: 'OP15-039',
  textHash: '1385eeb9460585',
  verified: {
    source: 'cards/overrides/OP15-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-attack',
      label: 'This Leader cannot attack',
      kind: 'permanent',
      apply: [{ restrict: { target: { from: 'self', owner: 'you' }, what: 'cannotAttack' } }],
    },
    {
      id: 'activate',
      label:
        'Rest this Leader and return 1 of your Dressrosa Characters to hand: play up to 1 Dressrosa Character with a cost of 3 from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        { restSelf: true },
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: { type: 'Dressrosa' },
            pick: { exactly: 1 },
          },
          to: { zone: 'hand' },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Character'] }, { type: 'Dressrosa' }, { cost: { eq: 3 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
