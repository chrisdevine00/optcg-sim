import type { CardScript } from '../../src/dsl.ts';

/** OP13-053 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_053: CardScript = {
  cardId: 'OP13-053',
  textHash: '01db60f241b907',
  verified: {
    source: 'cards/overrides/OP13-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label:
        'You may trash 1 of your Characters with a type including "Whitebeard Pirates": draw 1 card and this Character gains [Banish] during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'characters',
            owner: 'you',
            filter: { typeIncludes: 'Whitebeard Pirates' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Banish',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
