import type { CardScript } from '../../src/dsl.ts';

/** OP10-043 Moocy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_043: CardScript = {
  cardId: 'OP10-043',
  textHash: '00eaed81820daf',
  verified: {
    source: 'cards/overrides/OP10-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may rest 1 of your {Dressrosa} Leader or Stage: up to 1 of your [Monkey.D.Luffy] Characters gains [Banish] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
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
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  name: 'Monkey.D.Luffy',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Banish',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
