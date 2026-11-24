import type { CardScript } from '../../src/dsl.ts';

/** EB05-017 Mermaid Cafe Dancers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_017: CardScript = {
  cardId: 'EB05-017',
  textHash: '03046cc1dfe811',
  verified: {
    source: 'cards/overrides/EB05-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may rest 1 of your DON!! cards and trash this Character: your {Fish-Man} or {Merfolk} type Leader gains +4000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [
        {
          restDon: 1,
        },
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  any: [
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
              },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
