import type { CardScript } from '../../src/dsl.ts';

/** OP15-023 Arlong. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_023: CardScript = {
  cardId: 'OP15-023',
  textHash: '0a57465ec98f18',
  verified: {
    source: 'cards/overrides/OP15-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "Up to 2 of your opponent's rested cards will not become active in their next Refresh Phase",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            skipRefresh: {
              from: ['leader', 'characters', 'stage'],
              owner: 'opponent',
              filter: { state: 'rested' },
              pick: { upTo: 2 },
            },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label:
        "You may give 1 of your opponent's rested DON!! to 1 of their Characters: give up to 1 DON!! from their cost area to their Leader or 1 of their Characters",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'rested',
            from: 'opponent',
            to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'any',
              from: 'opponent',
              to: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (block 4 audit Q5): "rested cards" are the opponent\'s rested field cards (Leader, Characters, Stage); rested DON!! in the cost area are not targets of "will not become active"',
    "reading (M6b-Q44): the effect's DON!! comes from the opponent's cost area, active or rested; the giver picks the kind when both are there",
  ],
};
