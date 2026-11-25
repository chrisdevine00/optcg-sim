import type { CardScript } from '../../src/dsl.ts';

/** OP09-083 Van Augur. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_083: CardScript = {
  cardId: 'OP09-083',
  textHash: '12d5f1e65d913a',
  verified: {
    source: 'cards/overrides/OP09-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      label:
        "Rest this Character: with a {Blackbeard Pirates} Leader, give up to 1 of your opponent's Characters -3 cost during this turn",
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "You may rest this Character" on an [Activate: Main] is the player choosing to activate (no costOptional on a Character); the Leader "If" is after the colon, so the rest is paid even without a {Blackbeard Pirates} Leader',
  ],
};
