import type { CardScript } from '../../src/dsl.ts';

/** OP11-088 Shu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_088: CardScript = {
  cardId: 'OP11-088',
  textHash: '14224bad0de9f6',
  verified: {
    source: 'cards/overrides/OP11-088.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-opponent-attack',
      label:
        "Once Per Turn, when your opponent's Character attacks: if that Character has the <Slash> attribute, this Character gains +5000 power during this battle",
      kind: 'auto',
      optional: true,
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      conditions: [{ attackerIs: { category: ['Character'] } }],
      effect: [
        {
          if: { attackerIs: { attribute: 'Slash' } },
          then: [
            {
              do: {
                power: {
                  target: { from: 'self', owner: 'you' },
                  amount: 5000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "Reading (M6b-Q89): the trigger is any attack by one of your opponent's Characters (the Leader's attack does not trigger it and spends nothing); the Once Per Turn is spent by the activation, so a first attack by a Character that is not <Slash> uses it up and adds nothing. It is asked (the text says can be activated, W57-R5), so it may be declined and the Once Per Turn kept. The attribute is read as the attacker has it when the effect resolves",
  ],
};
