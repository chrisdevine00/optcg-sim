/**
 * Effects in the game log and the polite live region (review M4a-05): every resolution step has
 * words, written for the viewer, and hotseat logs name no card the other seat cannot see. Hotseat
 * uses the public log (what both seats may see), so these lines are the strictest case.
 */
import { describe, expect, it } from 'vitest';
import type { Action } from '@optcg/engine';
import { GameController } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap } from './support.ts';

const settle = () => new Promise((r) => setTimeout(r, 300));

async function kaidoAttack(mode: 'hotseat') {
  const { mode: _m, ...spec } = SCENARIOS.kaido!;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode,
      human: 'p1',
      names: { p1: 'Player 1', p2: 'Player 2' },
      tier: 'rookie',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
    },
  );
  ctl.start();
  await settle();
  ctl.liftCurtain();
  const v = ctl.view();
  const find = (pred: (a: Action) => boolean) => ctl.actions().find(pred) as Action;
  expect(
    ctl.act(
      find(
        (a) =>
          a.type === 'attack' &&
          a.attacker === v.zones.p1.leader[0]!.handle &&
          a.target === v.zones.p2.leader[0]!.handle,
      ),
    ),
  ).toBe(true);
  await settle();
  expect(ctl.act(find((a) => a.type === 'optional' && a.accept))).toBe(true);
  await settle();
  const spoken: string[] = [];
  let seq = ctl.polite.seq;
  const listen = setInterval(() => {
    if (ctl.polite.seq !== seq) {
      seq = ctl.polite.seq;
      spoken.push(ctl.polite.text);
    }
  }, 1);
  expect(ctl.act(find((a) => a.type === 'pick'))).toBe(true);
  if (ctl.polite.seq !== seq) spoken.push(ctl.polite.text);
  await settle();
  clearInterval(listen);
  return { ctl, spoken };
}

const text = (ctl: GameController) =>
  ctl
    .logLines()
    .map((l) => l.text)
    .join('\n');

describe('effect log lines (M4a-05)', () => {
  it("Kaido's DON!! −1 and the −2000 are logged and announced", async () => {
    const { ctl, spoken } = await kaidoAttack('hotseat');
    const log = text(ctl);
    expect(log).toMatch(/Kaido: Give up to 1 of your opponent's Characters −2000 power/);
    expect(log).toMatch(/Return 1 DON!! to the DON!! deck/);
    expect(log).toMatch(/Babanuki −2000/);
    // The polite region spoke the same move.
    expect(spoken.join(' ')).toMatch(/Babanuki −2000/);
    ctl.dispose();
  });

  it('never names a card hidden from the viewer: a draw by an effect is a count', async () => {
    // Kyo's [On Play] draws 1 for p1: p2's public log says "Draw 1" with no name.
    const ctl = new GameController(
      cardMap(),
      {
        scenario: {
          seed: 3,
          turn: 3,
          activePlayer: 'p1',
          firstPlayer: 'p1',
          p1: {
            leader: 'OP17-039',
            hand: ['OP17-045'],
            deck: ['OP17-118', 'OP02-060', 'OP02-060'],
            life: ['OP02-060'],
            costArea: { active: 2, rested: 0 },
          },
          p2: { leader: 'ST04-001', deck: ['ST05-007', 'ST05-007'], life: ['ST05-007'] },
        },
      },
      {
        mode: 'hotseat',
        human: 'p1',
        names: { p1: 'Player 1', p2: 'Player 2' },
        tier: 'rookie',
        autoSkip: true,
        alwaysSkip: false,
        speed: 4,
      },
    );
    ctl.start();
    await settle();
    ctl.liftCurtain();
    const kyo = ctl.view().zones.p1.hand[0]!.handle;
    expect(ctl.act(ctl.actions().find((a) => a.type === 'playCard' && a.card === kyo)!)).toBe(true);
    await settle();
    const log = text(ctl);
    expect(log).toMatch(/Kyo: Draw 1 card/);
    expect(log).toMatch(/Draw 1/);
    expect(log).not.toMatch(/Rocks\.D\.Xebec/);
    ctl.dispose();
  });
});
