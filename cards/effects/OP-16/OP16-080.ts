import type { CardScript } from '../../src/dsl.ts';

/** OP16-080 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_080: CardScript = {
  cardId: 'OP16-080',
  textHash: '04dc84087d4bc7',
  verified: {
    source: 'cards/overrides/OP16-080.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'cost-up',
      label: "[Opponent's Turn] All of your Characters gain +1 cost",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'you',
            },
            amount: 1,
          },
        },
      ],
    },
    {
      id: 'redirect',
      label:
        "[On Your Opponent's Attack] [Once Per Turn] You may trash 1 card with a [Trigger] from your hand: change the target of that attack to this Leader or to one of your {Blackbeard Pirates} Characters",
      kind: 'auto',
      oncePerTurn: true,
      when: ['onOpponentAttack'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            redirectAttack: {
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      category: ['Leader'],
                    },
                    {
                      type: 'Blackbeard Pirates',
                    },
                  ],
                },
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (D3, M6b-Q85, QA-OP16 OP16-080): redirecting to this Leader is an attack on a Leader; [On Your Opponent's Attack] does not fire again",
    'reading: "this Leader or one of your {Blackbeard Pirates} Characters" is an either-or choice made on resolution; the cost is optional (an auto with a cost) and needs a card with a [Trigger] in hand',
  ],
};
