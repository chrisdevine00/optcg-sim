import type { CardScript } from '../../src/dsl.ts';

/** OP13-062 Crocus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_062: CardScript = {
  cardId: 'OP13-062',
  textHash: '17e4e354a0e039',
  verified: {
    source: 'cards/overrides/OP13-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'With any DON!! given: add up to 1 DON!! active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donGiven: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        "Return up to 1 of your opponent's Characters with a base power of 3000 or less to the owner's hand",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  basePower: {
                    lte: 3000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [When Attacking] is unconditional; base power, inclusive at 3000 (a boosted 4000 base is not a target, a boosted 3000 base is)',
  ],
};
