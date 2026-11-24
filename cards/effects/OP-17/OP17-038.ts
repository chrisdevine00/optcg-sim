import type { CardScript } from '../../src/dsl.ts';

/** OP17-038 I Think He's Seen an Ugly Future.... Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_038: CardScript = {
  cardId: 'OP17-038',
  textHash: '00eca3281b0db5',
  verified: {
    source: 'cards/overrides/OP17-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "You may rest 4 of your cards: rest up to 1 of your opponent's Characters",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 4,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
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
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "rest 4 of your cards" draws from the Leader, Characters, Stage and active DON!! cards (OP15-035 / EB05-019 reading)',
  ],
};
