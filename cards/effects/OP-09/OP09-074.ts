import type { CardScript } from '../../src/dsl.ts';

/** OP09-074 Bepo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_074: CardScript = {
  cardId: 'OP09-074',
  textHash: '00f43014b41791',
  verified: {
    source: 'cards/overrides/OP09-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-returned',
      label:
        'When a DON!! card on your field is returned to your DON!! deck, up to 1 of your Leader or Character cards gains +1000 power during this turn',
      kind: 'auto',
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      oncePerTurn: true,
      conditions: [
        {
          yourTurn: true,
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
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: any return of your own DON!! counts (a DON!! -X cost or an effect), on your turn only, once per turn (the first return); the +1000 lasts for the turn and the target is chosen when the effect resolves (Bepo himself is a legal target)',
  ],
};
