import type { CardScript } from '../../src/dsl.ts';

/** ST16-002 Gordon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST16_002: CardScript = {
  cardId: 'ST16-002',
  textHash: '0369fce7509e2b',
  verified: {
    source: 'cards/overrides/ST16-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may trash any number of "Music" type cards from your hand; your Leader or 1 of your Characters gains +1000 power during this battle for every card trashed',
      kind: 'auto',
      when: ['onOpponentAttack'],
      effect: [
        {
          if: { cmp: [{ hand: 'you' }, '>=', 1] },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  filter: { type: 'Music' },
                  pick: { any: true },
                  bind: 'trashed',
                },
              },
            },
            {
              if: { cmp: [{ refCount: 'trashed' }, '>=', 1] },
              then: [
                {
                  do: {
                    power: {
                      target: {
                        from: ['leader', 'characters'],
                        owner: 'you',
                        pick: { exactly: 1 },
                      },
                      amount: { mul: [{ refCount: 'trashed' }, 1000] },
                      duration: 'battle',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G58): "You may trash any number" is the pick itself (choosing none is the decline), and the text has no colon, so it is an effect, not a cost; the bonus goes to one Leader or Character chosen after the trash, +1000 per card actually trashed, and is not asked at all when none was',
    'hidden information: the gate is the public hand size (at least 1 card), not "the hand holds a Music card"; the pick is asked at max 0 when none is held (DECISIONS "Empty picks", ADR 0005)',
    'reading: the quoted "Music" type is the exact type {Music}',
  ],
};
