import type { CardScript } from '../../src/dsl.ts';

/** OP12-119 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_119: CardScript = {
  cardId: 'OP12-119',
  textHash: '12fe904e350518',
  verified: {
    source: 'cards/overrides/OP12-119.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: add up to 1 card from the top of your deck to the top of your Life, then this Character gains +2 cost until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
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
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
        {
          do: {
            cost: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 2,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        "[Opponent's Turn] [On K.O.] Add up to 1 card from the top of your deck to the top of your Life",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the cost bonus applies once the hand card is trashed, even if the deck is empty and no Life card was added',
  ],
};
