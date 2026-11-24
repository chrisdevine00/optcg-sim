import type { CardScript } from '../../src/dsl.ts';

/** OP17-008 Jozu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_008: CardScript = {
  cardId: 'OP17-008',
  textHash: '016cc2b6c1c515',
  verified: {
    source: 'cards/overrides/OP17-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Your [Edward.Newgate] Leader's base power becomes 8000 until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setBasePower: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Edward.Newgate',
                },
              },
              value: 8000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};
