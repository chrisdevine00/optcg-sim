import type { CardScript } from '../../src/dsl.ts';

/** EB02-061 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_061: CardScript = {
  cardId: 'EB02-061',
  textHash: '1c26564a70789b',
  verified: {
    source: 'cards/overrides/EB02-061.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label:
        'If your Leader is multicolored and your opponent has 5 or more DON!! cards on their field, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            multicolor: true,
          },
        },
        {
          cmp: [
            {
              donOnField: 'opponent',
            },
            '>=',
            5,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        'Once per turn, you may return 2 of your active DON!! cards to your DON!! deck: set this Character as active; then add 1 card from the top of your Life cards to your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      cost: [
        {
          returnDon: {
            n: 2,
            state: 'active',
          },
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: both [Rush] conditions are checked continuously; the DON!! cost takes active cost-area DON!! only (G9) and is not payable with fewer than 2; "Then" is sequential, so the Life card is added to the hand even though setting active cannot fail, and with no Life nothing is added (the DON!! stay returned)',
  ],
};
