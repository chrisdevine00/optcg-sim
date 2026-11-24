import type { CardScript } from '../../src/dsl.ts';

/** EB04-004 Zeff. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_004: CardScript = {
  cardId: 'EB04-004',
  textHash: '1e34d86e5b7678',
  verified: {
    source: 'cards/overrides/EB04-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "Your Leader's base power becomes 7000 until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            setBasePower: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              value: 7000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: no "up to" and no type: the Leader is always set (also down to 7000 from a higher printed power); the duration is the plain until-end-of-opponent\'s-next-End-Phase (the engine knows whose turn it is)',
  ],
};
