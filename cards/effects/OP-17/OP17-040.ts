import type { CardScript } from '../../src/dsl.ts';

/** OP17-040 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_040: CardScript = {
  cardId: 'OP17-040',
  textHash: '12500c6bcc3736',
  verified: {
    source: 'cards/overrides/OP17-040.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'leader-battle',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'attack',
          attacker: {
            from: 'leader',
            owner: 'you',
            filter: {
              typeIncludes: 'Rocks Pirates',
            },
          },
        },
        {
          event: 'attack',
          target: {
            from: 'leader',
            owner: 'you',
            filter: {
              typeIncludes: 'Rocks Pirates',
            },
          },
        },
      ],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-18',
    'QA-OP17 OP17-040: "when attacked" activates with [On Your Opponent\'s Attack], before [Blocker] and Counter',
  ],
};
