/** ST29-005 Jinbe. */
import { describe, expect, it } from 'vitest';
import { PLAIN_BLUE } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { cardsIn, LUFFY_C, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'ST29-005';

describe('ST29-005 Jinbe', () => {
  it('[Trigger]: with a [Monkey.D.Luffy] Leader, plays this card (active)', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([]);
  });

  it('must not play with another Leader: the activated Trigger card is trashed', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('must not play when only a Character (not the Leader) is [Monkey.D.Luffy]', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE, characters: [LUFFY_C] });
    g.act({ type: 'trigger', activate: true });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([LUFFY_C]);
  });

  it('declining the Trigger adds the card to the hand', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: false });
    expect(cardsIn(g, 'p1', 'hand')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });

  it('the Life card is gone either way (damage was taken)', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(g.life('p1')).toBe(1);
  });
});
