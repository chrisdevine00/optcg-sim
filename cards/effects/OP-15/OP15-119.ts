import type { CardScript } from '../../src/dsl.ts';

/** OP15-119 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_119: CardScript = {
  cardId: 'OP15-119',
  textHash: '1508afda75264e',
  verified: {
    source: 'cards/overrides/OP15-119.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With 6 or more DON!! on your field, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [{ cmp: [{ donOnField: 'you' }, '>=', 6] }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush' } }],
    },
    {
      id: 'reveal-boost',
      label:
        'When your opponent activates an Event or [Blocker], reveal 1 Life card: +1000 power this turn per 1 cost on it',
      kind: 'auto',
      when: [
        { event: 'eventActivated', by: 'opponent' },
        { event: 'blockerActivated', by: 'opponent' },
      ],
      // "Reveal up to 1": the player may reveal none (M4b-07, CR 4-8-1), asked before the reveal.
      optional: true,
      conditions: [{ cmp: [{ life: 'you' }, '>=', 1] }],
      effect: [
        { do: { reveal: { from: 'lifeTop', n: 1, bind: 'revealed' } } },
        {
          do: {
            power: {
              target: { from: 'self', owner: 'you' },
              amount: { mul: [{ refStat: 'revealed', stat: 'cost' }, 1000] },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'No [Your Turn] on the text: the trigger works on either turn; the power lasts until the end of that turn',
    'M4b-07: "up to 1" may be 0: the activation is optional (CR 4-8-1, QA-GR); with no Life card it is not offered',
    'The revealed Life card stays where it is, face-down again; a card with no cost value counts as 0',
  ],
};
