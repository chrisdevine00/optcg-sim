import type { CardScript } from '../../src/dsl.ts';

/** EB02-060 Merry Go. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_060: CardScript = {
  cardId: 'EB02-060',
  textHash: '1bf3e5991c3136',
  verified: {
    source: 'cards/overrides/EB02-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        "You may rest this Stage and turn 1 card from the top of your Life cards face-up: up to 1 of your {Straw Hat Crew} Characters gains +1000 power until the end of your opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          turnLifeFaceUp: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Straw Hat Crew',
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: the cost turns the top Life card face-up (it needs a face-down top card), both costs are paid together, and the power goes to a Character chosen when the effect resolves',
  ],
};
