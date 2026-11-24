/**
 * EB05-013 Shirley (Character, Green, cost 3, 4000, Counter +1000, {Merfolk}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards: Your
 * {Fish-Man} or {Merfolk} type Leader gains +2000 power during this battle."
 *
 * Rules: CR 10-2-16 / RD 89 ([On Your Opponent's Attack] activates whatever the target is),
 * CR 10-2-13, CR 8-3-1-3/-4 (costs), RL-08 ("during this battle"), RL-34, CR 8-3-3.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, noDefence, fill } from '../../helpers.ts';
import {
  accept,
  choices,
  choose,
  decider,
  decline,
  payDon,
  don,
  EL,
  kind,
  mine,
  offered,
  RED,
  skipUnusable,
  theirs,
  VAN,
} from './kit-eb05a.ts';

const SHIRLEY = 'EB05-013';

function defending(leader: string, active = 3) {
  return theirs(
    leader,
    { characters: [SHIRLEY], life: fill(RED, 4), costArea: { active, rested: 0 } },
    { characters: [VAN.kingdew] },
  );
}
/** Say yes to the cost, pay it with 1 DON!!, and pick the Leader if the engine asks for the target. */
function use(g: ReturnType<typeof defending>) {
  accept(g);
  payDon(g, 1);
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) choose(g, [g.leader('p1')]);
}
const toLeader = (g: ReturnType<typeof defending>, attacker = g.leader('p2')) =>
  attack(g, attacker, g.leader('p1'));

describe('EB05-013 Shirley: [On Your Opponent’s Attack] [Once Per Turn] rest 1 DON!!: Fish-Man or Merfolk Leader +2000', () => {
  it('a {Fish-Man} Leader gains +2000 during the battle; 1 DON!! is rested', () => {
    const g = defending(EL.fishMan);
    toLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it('a {Merfolk} Leader also qualifies', () => {
    const g = defending(EL.shirahoshi);
    toLeader(g);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the boost lasts during the battle (it decides it) and ends with the battle', () => {
    const g = defending(EL.fishMan);
    toLeader(g);
    use(g);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader of neither type gets no boost', () => {
    const g = defending(EL.croc);
    toLeader(g);
    if (offered(g, 'p1')) accept(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('activates whatever is attacked: the Leader gets +2000 when one of my Characters is the target', () => {
    const g = theirs(
      EL.fishMan,
      {
        characters: [{ card: SHIRLEY, rested: true }],
        life: fill(RED, 4),
        costArea: { active: 3, rested: 0 },
      },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', SHIRLEY));
    expect(offered(g, 'p1')).toBe(true);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  // DISAGREEMENTS-a.md EB05-013: the Leader is not an "up to" target.
  it.fails(
    'the Leader boost has no "up to": after paying, the player cannot choose to skip it',
    () => {
      const g = defending(EL.fishMan);
      toLeader(g);
      accept(g);
      payDon(g, 1);
      expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    },
  );

  it('CR 8-3-1-4: declining the cost rests no DON!! and gives no boost', () => {
    const g = defending(EL.fishMan);
    toLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with no active DON!! the cost cannot be paid', () => {
    const g = defending(EL.fishMan, 0);
    toLeader(g);
    skipUnusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: not offered for a second attack in the same turn', () => {
    const g = theirs(
      EL.fishMan,
      { characters: [SHIRLEY], life: fill(RED, 4), costArea: { active: 3, rested: 0 } },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    use(g);
    noDefence(g);
    expect(kind(g)).toBe('main');
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn] counts resolved uses: declining on the first attack leaves it available on the second', () => {
    const g = theirs(
      EL.fishMan,
      { characters: [SHIRLEY], life: fill(RED, 4), costArea: { active: 3, rested: 0 } },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    noDefence(g);
    expect(kind(g)).toBe('main');
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('does not activate on my own attacks (it is for the opponent’s attack only)', () => {
    const g = mine(EL.fishMan, { characters: [SHIRLEY, VAN.kingdew] }, {});
    attack(g, g.find('p1', 'characters', VAN.kingdew), g.leader('p2'));
    expect(decider(g)).toBe('p2');
    expect(don(g)).toMatchObject({ rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
