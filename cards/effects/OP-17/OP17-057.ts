import type { CardScript } from '../../src/dsl.ts';

/** OP17-057 Fullalead. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_057: CardScript = {
  cardId: 'OP17-057',
  textHash: '129272134f7f4e',
  verified: {
    source: 'cards/overrides/OP17-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may rest this Stage and trash 1 card from your hand: up to 1 of your "Rocks Pirates" Leader or Characters gains +1000 power during this battle',
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
                filter: {
                  typeIncludes: 'Rocks Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: ['block5 Q13: "Leader ... or ... Characters" is one target in total'],
};
