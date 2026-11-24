import type { CardScript } from '../../src/dsl.ts';

/** OP17-064 King. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_064: CardScript = {
  cardId: 'OP17-064',
  textHash: '0b5aedd0398676',
  verified: {
    source: 'cards/overrides/OP17-064.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
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
