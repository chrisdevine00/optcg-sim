import type { CardScript } from '../../src/dsl.ts';

/** OP16-041 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_041: CardScript = {
  cardId: 'OP16-041',
  textHash: '14af6ee63987d7',
  verified: {
    source: 'cards/overrides/OP16-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'removed',
      label:
        'When your {Impel Down} Character is removed from the field, play up to 1 [Prisoner of Impel Down] from your hand',
      kind: 'auto',
      when: [
        {
          event: 'removed',
          owner: 'you',
          filter: { all: [{ category: ['Character'] }, { type: 'Impel Down' }] },
        },
      ],
      oncePerTurn: true,
      conditions: [{ donGiven: 1 }],
      effect: [
        {
          // Gated on the public hand size only: the pick is asked at max 0 when no [Prisoner]
          // is held, so the prompt never tells the opponent what the hand holds (ADR 0005).
          if: { cmp: [{ hand: 'you' }, '>=', 1] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: { name: 'Prisoner of Impel Down' },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q17, Q42, Q43): "removed from the field" is any move off the field, by either player, in battle or by effect or cost or the Character limit; the Character\'s printed {Impel Down} type is read as it left',
    'reading: [DON!! x1] is a condition of the ability (checked when it triggers and when it resolves)',
  ],
};
