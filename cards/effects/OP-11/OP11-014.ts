import type { CardScript } from '../../src/dsl.ts';

/** OP11-014 Borsalino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_014: CardScript = {
  cardId: 'OP11-014',
  textHash: '036228e590aa46',
  verified: {
    source: 'cards/overrides/OP11-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'attack-active',
      label:
        'You may rest this Character: up to 1 of your {Navy} Leader or Character cards can also attack active Characters this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            canAttackActive: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'Navy',
                },
                pick: {
                  upTo: 1,
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: Borsalino rests as the cost, so he can be the chosen attacker only if he is active again; the grant lasts this turn',
  ],
};
