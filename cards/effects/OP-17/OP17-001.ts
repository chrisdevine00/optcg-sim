import type { CardScript } from '../../src/dsl.ts';

/** OP17-001 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_001: CardScript = {
  cardId: 'OP17-001',
  textHash: '083e77dfe7604a',
  verified: {
    source: 'cards/overrides/OP17-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +4000 power during this battle',
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
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
