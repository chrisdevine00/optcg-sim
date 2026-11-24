import type { CardScript } from '../../src/dsl.ts';

/** OP13-055 Rakuyo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_055: CardScript = {
  cardId: 'OP13-055',
  textHash: '1de6baf5f458b0',
  verified: {
    source: 'cards/overrides/OP13-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        'If you have 4 or less cards in your hand, all of your Characters with a type including "Whitebeard Pirates" gain +1000 power during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: { cmp: [{ hand: 'you' }, '<=', 4] },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { typeIncludes: 'Whitebeard Pirates' },
                  },
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
