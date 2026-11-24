import type { CardScript } from '../../src/dsl.ts';

/** OP12-072 Zeff. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_072: CardScript = {
  cardId: 'OP12-072',
  textHash: '12cdfcb777142a',
  verified: {
    source: 'cards/overrides/OP12-072.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'When a DON!! card on your field is returned to your DON!! deck, if your Leader is [Sanji], this Character gains [Rush] during this turn',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you' }],
      conditions: [{ leader: { name: 'Sanji' } }],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading: the Leader check is an intervening "if" (a condition of the ability, read when the DON!! is returned and again on resolution); any return of your DON!! counts, whoever caused it (a cost, your effect or the opponent\'s), on either turn; [Rush] is gained, not printed',
  ],
};
