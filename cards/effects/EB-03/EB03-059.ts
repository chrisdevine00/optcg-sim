import type { CardScript } from '../../src/dsl.ts';

/** EB03-059 S-Snake. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_059: CardScript = {
  cardId: 'EB03-059',
  textHash: '06a286fc4e984c',
  verified: {
    source: 'cards/overrides/EB03-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Egghead} type and you have 2 or more Life, add up to 1 Character with a [Trigger] from your hand to the top of your Life face-up',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [{ leader: { type: 'Egghead' } }, { cmp: [{ life: 'you' }, '>=', 2] }],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: { all: [{ category: ['Character'] }, { hasTrigger: true }] },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'life', position: 'top', faceUp: true },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Up to 1 of your opponent's Characters with a cost of 6 or less other than [Monkey.D.Luffy] cannot attack during this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { all: [{ cost: { lte: 6 } }, { not: { name: 'Monkey.D.Luffy' } }] },
                pick: { upTo: 1 },
              },
              what: 'cannotAttack',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};
