import type { CardScript } from '../../src/dsl.ts';

/** EB04-050 I'll Whip You Into Shape. ♡. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_050: CardScript = {
  cardId: 'EB04-050',
  textHash: '0dae924bcb4e94',
  verified: {
    source: 'cards/overrides/EB04-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Up to 1 of your {SWORD} type Leader or Character cards can also attack active Characters during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            canAttackActive: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'SWORD' },
                pick: { upTo: 1 },
              },
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
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
