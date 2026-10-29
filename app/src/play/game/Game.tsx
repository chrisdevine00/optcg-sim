/**
 * The game screen: board, rail, preview dock and inspector, dialogs, hotseat curtain, live regions
 * and the keyboard model (board.md, flows.md, accessibility.md).
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as RKeyboardEvent,
  type MouseEvent as RMouseEvent,
} from 'react';
import type { Action, PlayerId } from '@optcg/engine';
import { Board, PhaseStepper, ZONE_ORDER, type CardDeco, type ZoneKey } from '../board/Board.tsx';
import { computeLayout, placeDock, type Layout, type Rect } from '../board/layout.ts';
import {
  DecisionPanel,
  commitDefence,
  counterOptions,
  defenceNumbers,
  defendingTarget,
  donIntent,
  giveOne,
  isTall,
  resetDonIntent,
  stagedActions,
  toggleCounter,
} from '../rail/Decision.tsx';
import { GameLog, RailHeader } from '../rail/Rail.tsx';
import type { GameController } from './controller.ts';
import { legalOf } from './legal.ts';
import { cardName, num, other, statusSummary } from './text.ts';
import { NO_STAGING, type G, type Staging, type UiMode } from './ui.ts';
import { CardDock, type DockState } from './Dock.tsx';
import { Dialogs, type DialogState } from './Dialogs.tsx';

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = () => {
      clearTimeout(t);
      t = setTimeout(() => setVp(read()), 100);
    };
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      clearTimeout(t);
    };
  }, []);
  return vp;
}

/** The battle whose attack line was last announced (flows F6.1), so it is said once. */
const lastBattleAnnounced: { key: string | null } = { key: null };
function markAnnounced(key: string) {
  lastBattleAnnounced.key = key;
}

/** Where focus returns when a dialog, menu or the inspector closes (accessibility §4.3). */
const focusMemory: { el: HTMLElement | null } = { el: null };
const veilFocus = { pending: false };
function markVeilFocus() {
  veilFocus.pending = true;
}
function takeVeilFocus(): boolean {
  const p = veilFocus.pending;
  veilFocus.pending = false;
  return p;
}
function rememberFocus(el: Element | null = document.activeElement) {
  focusMemory.el = el as HTMLElement | null;
}

const isTyping = (el: Element | null) =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    (el as HTMLElement).isContentEditable);

export function Game({
  ctl,
  onNewGame,
  onRematch,
  onHome,
}: {
  ctl: GameController;
  onNewGame: () => void;
  onRematch: () => void;
  onHome: () => void;
}) {
  useSyncExternalStore(ctl.subscribe, ctl.getVersion);
  const vp = useViewport();
  const L: Layout = useMemo(() => computeLayout(vp.w, vp.h), [vp.w, vp.h]);
  const view = ctl.view();
  const me = ctl.me;
  const opp = other(me);
  const mine = ctl.myDecision();
  // Legal moves come from the seat's own actions, limited while veiled (ctl.actions).
  const legal = legalOf({ ...view, actions: ctl.actions() }, mine);
  const names = ctl.names();
  const cards = ctl.cards;
  const decisionKey = `${ctl.session.actionCount}|${view.decision?.kind ?? ''}|${view.decision?.player ?? ''}|${me}`;

  // Transient modes belong to one decision: when the decision changes they reset, except that
  // DON!! mode survives its own gives (board.md §4.2). Kept with their key, derived in render.
  const [ui0, setUi0] = useState<{ key: string; turn: number; ui: UiMode }>({
    key: decisionKey,
    turn: view.turn.number,
    ui: { kind: 'idle' },
  });
  const [st0, setSt0] = useState<{ key: string; s: Staging }>({ key: decisionKey, s: NO_STAGING });
  const [pk0, setPk0] = useState<{ key: string; p: string[] }>({ key: decisionKey, p: [] });
  const [roving, setRoving] = useState<Record<string, number>>({});
  const [dock, setDock] = useState<DockState>({ handle: null, pinned: false, how: 'hover' });
  const [dialog, setDialog] = useState<DialogState>(null);
  const [why, setWhy] = useState<{ text: string; at: Rect | null } | null>(null);
  const [goto, setGoto] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const ui: UiMode =
    ui0.key === decisionKey ||
    (ui0.ui.kind === 'don' && legal.give.size > 0 && ui0.turn === view.turn.number)
      ? ui0.ui
      : { kind: 'idle' };
  const staging = st0.key === decisionKey ? st0.s : NO_STAGING;
  const picks = pk0.key === decisionKey ? pk0.p : [];
  const setStaging = (s: Staging) => setSt0({ key: decisionKey, s });
  const setPicks = (p: string[]) => setPk0({ key: decisionKey, p });
  const setUi = (m: UiMode) => {
    setUi0({ key: decisionKey, turn: view.turn.number, ui: m });
    setMenuFor(null);
    if (m.kind !== 'don') resetDonIntent();
  };

  // Card lookups by handle in the current view.
  const index = new Map<
    string,
    { view: (typeof view.zones)['p1']['hand'][number]; owner: PlayerId; zone: string }
  >();
  for (const p of ['p1', 'p2'] as PlayerId[])
    for (const [zone, list] of Object.entries(view.zones[p]))
      for (const c of list) index.set(c.handle, { view: c, owner: p, zone });
  // Cards this player is looking at through an effect (a deck search, M4a) are named too.
  for (const c of view.looking ?? [])
    index.set(c.handle, { view: c, owner: view.player, zone: 'looking' });
  const cardOf = (h: string) => {
    const x = index.get(h);
    if (!x) return null;
    return {
      card: x.view.card ? cards.get(x.view.card) : undefined,
      power: x.view.power,
      owner: x.owner,
      zone: x.zone,
    };
  };
  const nameOf = (h: string) => cardName(cards, index.get(h)?.view.card);
  const act = (a: Action, intentId?: string) => {
    ctl.act(a, intentId);
  };

  const openInspector = (h: string) => {
    rememberFocus();
    setDock({ handle: h, pinned: true, how: 'focus' });
  };

  const g: G = {
    ctl,
    view,
    me,
    opp,
    L,
    legal,
    cards,
    names,
    mine,
    ui,
    setUi,
    staging,
    setStaging,
    picks,
    setPicks,
    act,
    cardOf,
    nameOf,
    whyText: (t) => setWhy(t ? { text: t, at: null } : null),
    openInspector,
    onNewGame,
    onRematch,
    onRewind: () => requestRewind(() => ctl.rewindMove()),
    openRewindList: () => openRewindList(),
    requestRewind: (run) => requestRewind(run),
  };

  const tall = isTall(g);

  // A pinned inspector whose card left the rendered view (a reveal ended) closes, and focus
  // returns to the hand veil, so the keyboard never dead-ends (review M3-27).
  const dockOpen = dock.handle !== null && !!index.get(dock.handle)?.view.card;
  if (dock.handle !== null && !dockOpen) {
    if (dock.pinned) markVeilFocus();
    setDock({ handle: null, pinned: false, how: 'hover' });
  }
  useEffect(() => {
    if (takeVeilFocus()) document.querySelector<HTMLElement>('.hand-veil')?.focus();
  });

  /**
   * Rewind is off while a hotseat hand is veiled or curtained (review M3-04, M3-24), and in
   * hotseat it needs the other player's agreement (flows F11 step 7).
   */
  function requestRewind(run: () => void) {
    if (!ctl.canRewind()) {
      setWhy({ text: 'Rewind is unavailable while a hand is hidden.', at: null });
      ctl.announce('Rewind is unavailable while a hand is hidden.');
      return;
    }
    if (ctl.hotseat) {
      rememberFocus();
      setDialog({ kind: 'consent', run });
      return;
    }
    run();
  }
  function openRewindList() {
    if (!ctl.canRewind()) return requestRewind(() => undefined);
    rememberFocus();
    setDialog({ kind: 'rewind' });
  }

  // ---------------- Decorations (board.md §2.5) ----------------
  const kind = legal.kind;
  const battle = view.battle;
  const counterOpts =
    mine && (kind === 'block' || kind === 'counter') ? counterOptions(g, staging) : null;
  // Staged Counters show on the board at once (flows F6 step 3), from the scratch simulation.
  const stagedPowers = new Map<string, number | null>();
  if (counterOpts && staging.counters.length && ctl.revealed()) {
    const sim = ctl.session.simulate(me, stagedActions(g, staging));
    for (const c of [...sim.view.zones[me].leader, ...sim.view.zones[me].characters])
      stagedPowers.set(c.handle, c.power);
  }
  const deco = (h: string): CardDeco => {
    const c = index.get(h);
    const out: CardDeco = { chips: [] };
    if (!c) return out;
    if (stagedPowers.has(h) && stagedPowers.get(h) !== c.view.power)
      out.power = stagedPowers.get(h)!;
    const owner = c.owner;
    if (ctl.highlight?.handle === h) out.acting = ctl.highlight.word;
    if (battle && (battle.attacker === h || battle.target === h || staging.blocker === h))
      out.battle = true;
    if (battle?.attacker === h && !view.result)
      out.chips!.push({ text: '⚔ attacking', tone: 'attack' });
    const isSick =
      c.zone === 'characters' &&
      owner === me &&
      kind === 'main' &&
      !c.view.rested &&
      view.turn.number > 2 &&
      !legal.attacks.has(h);
    if (kind === 'main') {
      if (ui.kind === 'target' || ui.kind === 'confirm') {
        const tgts = legal.attacks.get(ui.attacker) ?? [];
        const isT = tgts.some((a) => a.type === 'attack' && a.target === h);
        if (h === ui.attacker) {
          out.selected = true;
          out.chips!.push({ text: '✓ Selected', tone: 'you' });
        } else if (isT) {
          out.legal = true;
          out.glyph = 'target';
          if (ui.kind === 'confirm' && ui.target === h) out.selected = true;
        } else if (c.zone === 'leader' || c.zone === 'characters') out.dim = true;
      } else if (ui.kind === 'don' || ui.kind === 'count') {
        if (legal.give.has(h)) {
          out.legal = true;
          out.glyph = 'don';
        }
      } else {
        if (legal.play.has(h)) {
          out.legal = true;
          out.glyph = 'play';
        } else if (legal.attacks.has(h)) {
          out.legal = true;
          out.glyph = 'attack';
        } else if (legal.activate.has(h)) {
          out.legal = true;
          out.glyph = 'ability';
        }
        if (ui.kind === 'selected' && ui.handle === h) {
          out.selected = true;
          out.chips!.push({ text: '✓ Selected', tone: 'you' });
        }
      }
      if (isSick && !out.selected) out.chips!.push({ text: 'New' });
    }
    if (kind === 'block' && legal.blocks.has(h)) {
      out.legal = true;
      out.glyph = 'block';
      if (staging.blocker === h) {
        out.selected = true;
        out.chips!.push({ text: '✓ Blocking', tone: 'you' });
      }
    }
    if ((kind === 'block' || kind === 'counter') && counterOpts?.has(h) && !ctl.handHidden()) {
      const st = staging.counters.findIndex((x) => x.card === h);
      out.legal = true;
      out.glyph = st >= 0 ? 'pick' : 'play';
      if (st >= 0) {
        out.raised = true;
        out.chips!.push({
          text: `+${num(c.view.card ? cards.get(c.view.card)?.counter : 0)} ✓`,
          tone: 'you',
        });
        out.extraName = [`staged ${st + 1} of ${staging.counters.length}`];
      }
    }
    if (kind === 'choose' && legal.picks.has(h)) {
      out.legal = true;
      out.glyph = 'target';
      const k = picks.indexOf(h);
      if (k >= 0) {
        out.selected = true;
        out.chips!.push({ text: `✓ ${k + 1}`, tone: 'you' });
      } else if (view.decision?.prompt.includes('Character area is full')) {
        // board.md §3.7: the candidates say what happens to them (M3-22).
        out.chips!.push({ text: 'Trash · not a K.O.', tone: 'warn' });
        out.extraName = ['trash to make room, not a K.O.'];
      }
    }
    if (
      kind === 'choose' &&
      !legal.picks.has(h) &&
      (c.zone === 'characters' || c.zone === 'leader')
    )
      out.dim = true;
    return out;
  };

  // ---------------- Card activation ----------------
  const flashWhy = (h: string, text: string) => {
    const el = document.querySelector<HTMLElement>(`[data-handle="${h}"]`);
    const r = el?.getBoundingClientRect();
    setWhy({ text, at: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null });
    ctl.announce(text);
  };

  const activate = (h: string, viaKey: boolean) => {
    setWhy(null);
    const c = index.get(h);
    if (!c) return;
    if (!mine) {
      openMenu(h, viaKey);
      return;
    }
    if (kind === 'main') {
      if (ui.kind === 'target' || ui.kind === 'confirm') {
        const atk = legal.attacks
          .get(ui.attacker)
          ?.find((a) => a.type === 'attack' && a.target === h);
        if (atk) {
          if (ui.kind === 'confirm' && ui.target === h) act(atk);
          else setUi({ kind: 'confirm', attacker: ui.attacker, target: h });
          return;
        }
        if (h === ui.attacker) {
          setUi({ kind: 'idle' });
          return;
        }
        if (c.owner === opp && (c.zone === 'characters' || c.zone === 'leader')) {
          const r = ctl.session.whyNot(me, { type: 'attack', attacker: ui.attacker, target: h });
          if (r) flashWhy(h, r.text + (r.rule ? ` (${r.rule})` : ''));
          return;
        }
      }
      if (ui.kind === 'don') {
        if (legal.give.has(h)) {
          giveOne(g, h);
          return;
        }
        setUi({ kind: 'idle' });
      }
      if (legal.attacks.has(h) && !viaKey) {
        setUi({ kind: 'target', attacker: h });
        return;
      }
      if (c.owner === me && (c.zone === 'hand' || legal.give.has(h) || legal.attacks.has(h))) {
        setUi({ kind: 'selected', handle: h });
        rememberFocus();
        setMenuFor(h);
        return;
      }
    }
    if (kind === 'block' && legal.blocks.has(h)) {
      setStaging({ ...staging, blocker: staging.blocker === h ? null : h });
      return;
    }
    if ((kind === 'block' || kind === 'counter') && counterOpts?.has(h) && !ctl.handHidden()) {
      toggleCounter(g, h);
      return;
    }
    if (kind === 'choose' && legal.picks.has(h)) {
      const max = view.decision?.max ?? 1;
      setPicks(
        picks.includes(h)
          ? picks.filter((x) => x !== h)
          : picks.length < max
            ? [...picks, h]
            : max === 1
              ? [h]
              : picks,
      );
      return;
    }
    openMenu(h, viaKey);
  };

  const openMenu = (h: string, viaKey: boolean) => {
    const c = index.get(h);
    if (!c) return;
    if (!viaKey) {
      // Unlit card in idle: its whyNot, nothing selected (board.md §4.2).
      if (mine && kind === 'main' && c.owner === me) {
        const r =
          c.zone === 'hand'
            ? ctl.session.whyNot(me, { type: 'playCard', card: h })
            : ctl.session.whyNot(me, {
                type: 'attack',
                attacker: h,
                target: view.zones[opp].leader[0]!.handle,
              });
        if (r) flashWhy(h, r.text + (r.rule ? ` (${r.rule})` : ''));
      }
      if (c.view.card) setDock({ handle: h, pinned: false, how: 'hover' });
      return;
    }
    rememberFocus();
    setMenuFor(h);
  };

  // ---------------- Keyboard (accessibility.md §3) ----------------
  const focusZone = (z: ZoneKey, near?: DOMRect) => {
    const items = [...document.querySelectorAll<HTMLElement>(`[data-zone="${z}"][data-item]`)];
    if (!items.length) return;
    let best = items[Math.min(roving[z] ?? 0, items.length - 1)]!;
    if (near) {
      const cx = near.x + near.width / 2;
      best = items.reduce((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return Math.abs(rb.x + rb.width / 2 - cx) < Math.abs(ra.x + ra.width / 2 - cx) ? b : a;
      });
    }
    best.focus();
  };

  const focusDecision = () => {
    document.getElementById('decision-title')?.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (isTyping(t)) return;
    if (dialog || (dock.pinned && dockOpen)) return; // dialogs handle their own keys
    if (ctl.curtainFor) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        ctl.liftCurtain();
      }
      return;
    }
    // Hold R to see your hand (hotseat defence) overrides R everywhere while it applies.
    if (ctl.hotseat && ctl.handVeil === 'hold' && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      ctl.setReveal(true);
      return;
    }
    if (ctl.hotseat && ctl.handVeil === 'click' && e.key === ' ' && !t?.closest('button')) {
      e.preventDefault();
      ctl.showHand();
      return;
    }
    if (menuFor) return;
    const inBoard = !!t?.closest('.board');
    const inDecision = !!t?.closest('#decision');
    const scoped = inBoard || inDecision || t === document.body || !t;
    const zoneEl = t?.closest<HTMLElement>('[data-zone]');
    const zone = (t?.dataset.zone ?? zoneEl?.dataset.zone) as ZoneKey | undefined;
    const key = e.key;

    if (goto) {
      e.preventDefault();
      setGoto(false);
      const map: Record<string, ZoneKey | 'decision' | 'log'> = {
        h: 'hand',
        c: 'my-chars',
        l: 'my-row',
        s: 'my-row',
        d: 'my-row',
        n: 'my-row',
        k: 'my-row',
        t: 'my-row',
        f: 'my-row',
        C: 'opp-chars',
        L: 'opp-row',
        S: 'opp-row',
        D: 'opp-row',
        N: 'opp-row',
        K: 'opp-row',
        T: 'opp-row',
        F: 'opp-row',
        H: 'opp-id',
        m: 'mid',
        p: 'decision',
        b: 'decision',
        g: 'log',
      };
      const dest = map[key];
      if (dest === 'decision') focusDecision();
      else if (dest === 'log') document.querySelector<HTMLElement>('.log-list')?.focus();
      else if (dest) focusZone(dest);
      return;
    }

    // Arrows inside a board zone (roving tabindex).
    if (
      inBoard &&
      zone &&
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)
    ) {
      e.preventDefault();
      // Target mode cycles legal targets only (accessibility §3.5).
      if (
        (ui.kind === 'target' || ui.kind === 'confirm') &&
        (key === 'ArrowLeft' || key === 'ArrowRight')
      ) {
        const tg = (legal.attacks.get(ui.attacker) ?? []).map((a) =>
          a.type === 'attack' ? a.target : '',
        );
        const cur = tg.indexOf(t?.dataset.handle ?? '');
        const next =
          tg[
            (cur +
              (key === 'ArrowRight' ? 1 : tg.length - 1) +
              (cur < 0 && key === 'ArrowRight' ? 0 : 0)) %
              tg.length
          ];
        if (next) document.querySelector<HTMLElement>(`[data-handle="${next}"]`)?.focus();
        return;
      }
      const items = [
        ...document.querySelectorAll<HTMLElement>(`[data-zone="${zone}"][data-item]`),
      ].sort((a, b) => Number(a.dataset.item) - Number(b.dataset.item));
      const i = items.findIndex((x) => x === t);
      if (key === 'ArrowLeft' && i > 0) items[i - 1]!.focus();
      if (key === 'ArrowRight' && i < items.length - 1) items[i + 1]!.focus();
      if (key === 'Home') items[0]?.focus();
      if (key === 'End') items.at(-1)?.focus();
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        const zi = ZONE_ORDER.indexOf(zone);
        const nz = ZONE_ORDER[zi + (key === 'ArrowUp' ? -1 : 1)];
        if (nz) focusZone(nz, t!.getBoundingClientRect());
      }
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      if (why) setWhy(null);
      if (
        mine &&
        (kind === 'block' || kind === 'counter') &&
        (staging.counters.length || staging.blocker)
      )
        setStaging(NO_STAGING);
      else if (mine && kind === 'choose' && picks.length) setPicks([]);
      else if (ui.kind === 'confirm') setUi({ kind: 'target', attacker: ui.attacker });
      else if (ui.kind !== 'idle') {
        const back = ui.kind === 'target' ? ui.attacker : ui.kind === 'selected' ? ui.handle : null;
        setUi({ kind: 'idle' });
        if (back) document.querySelector<HTMLElement>(`[data-handle="${back}"]`)?.focus();
      } else if (dock.handle) setDock({ handle: null, pinned: false, how: 'hover' });
      return;
    }

    if (!scoped || e.altKey || e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+Z: alias for Rewind where the browser lets the page receive it.
      if ((e.ctrlKey || e.metaKey) && (key === 'z' || key === 'Z') && scoped && !e.shiftKey) {
        e.preventDefault();
        requestRewind(() => ctl.rewindMove());
      }
      return;
    }

    const focusedHandle = t?.dataset.handle ?? null;

    // Decision-scoped letters (accessibility §3.15 item 7) override board letters.
    if (mine && kind === 'mulligan' && (key === 'k' || key === 'K' || key === 'r' || key === 'R')) {
      e.preventDefault();
      const a = legal.mulligan.find(
        (x) => x.type === 'mulligan' && x.redraw === (key.toLowerCase() === 'r'),
      );
      if (a) act(a);
      return;
    }
    if (mine && kind === 'chooseFirst' && (key === '1' || key === '2')) {
      e.preventDefault();
      const a = legal.chooseFirst.find(
        (x) => x.type === 'chooseFirst' && x.goFirst === (key === '1'),
      );
      if (a) act(a);
      return;
    }

    if ((key === 'Enter' || key === ' ') && inBoard && focusedHandle) {
      e.preventDefault();
      activate(focusedHandle, true);
      return;
    }
    if (key === 'Enter' && !inBoard && !t?.closest('button')) {
      // Enter commits the primary only when it is a safe commit (never "Take the hit", C8).
      const id = primaryEnterId(g);
      if (id) {
        e.preventDefault();
        document.getElementById(id)?.click();
      }
      return;
    }
    if (key === 'Enter' && inBoard && !focusedHandle) return;

    switch (key) {
      case 'p':
      case 'P':
        if (menuFor) return;
        e.preventDefault();
        focusDecision();
        return;
      case 'g':
      case 'G':
        e.preventDefault();
        setGoto(true);
        return;
      case 'e':
      case 'E':
        if (mine && kind === 'main' && legal.endTurn) {
          e.preventDefault();
          act(legal.endTurn);
        }
        return;
      case 'a':
      case 'A':
        if (focusedHandle && mine && kind === 'main') {
          e.preventDefault();
          if (legal.attacks.has(focusedHandle)) {
            setUi({ kind: 'target', attacker: focusedHandle });
            const first = legal.attacks.get(focusedHandle)![0];
            if (first?.type === 'attack')
              setTimeout(
                () =>
                  document.querySelector<HTMLElement>(`[data-handle="${first.target}"]`)?.focus(),
                30,
              );
          } else {
            const r = ctl.session.whyNot(me, {
              type: 'attack',
              attacker: focusedHandle,
              target: view.zones[opp].leader[0]!.handle,
            });
            if (r) flashWhy(focusedHandle, `${nameOf(focusedHandle)} can’t attack: ${r.text}`);
          }
        }
        return;
      case '+':
      case '=':
        if (focusedHandle && mine && kind === 'main') {
          e.preventDefault();
          if (legal.give.has(focusedHandle)) {
            rememberFocus(t);
            setUi({ kind: 'count', target: focusedHandle, n: 1 });
          } else {
            const r = ctl.session.whyNot(me, { type: 'giveDon', target: focusedHandle });
            if (r) flashWhy(focusedHandle, r.text);
          }
        }
        return;
      case 'i':
      case 'I':
        if (focusedHandle && index.get(focusedHandle)?.view.card) {
          e.preventDefault();
          openInspector(focusedHandle);
        }
        return;
      case 'u':
        e.preventDefault();
        requestRewind(() => ctl.rewindMove());
        return;
      case 'U':
        e.preventDefault();
        requestRewind(() => ctl.backToMyLastDecision());
        return;
      case 'r':
      case 'R':
        e.preventDefault();
        openRewindList();
        return;
      case 's':
      case 'S':
        if (!ctl.hotseat && view.turn.activePlayer !== me) {
          e.preventDefault();
          ctl.skip();
        }
        return;
      case 'k':
      case 'K':
        e.preventDefault();
        ctl.togglePause();
        return;
      case '.':
        e.preventDefault();
        ctl.nextMove();
        return;
      case '[':
      case ']': {
        e.preventDefault();
        const order = ['step', 0.5, 1, 2, 4] as const;
        const i = order.indexOf(ctl.speed);
        const n = order[Math.max(0, Math.min(order.length - 1, i + (key === ']' ? 1 : -1)))]!;
        ctl.setSpeed(n);
        ctl.announce(`Speed ${n === 'step' ? 'Step' : `${n}×`}.`);
        return;
      }
      case 'q':
      case 'Q': {
        e.preventDefault();
        const phase = view.battle
          ? `battle, ${view.turn.battleStep ?? ''} step`
          : `${view.turn.activePlayer === me ? 'your' : 'opponent’s'} ${view.turn.phase} phase`;
        ctl.announce(statusSummary(view, names, phase));
        return;
      }
      case '?':
        e.preventDefault();
        rememberFocus(t);
        setDialog({ kind: 'shortcuts' });
        return;
      case 'M':
      case 'm':
        e.preventDefault();
        focusDecision();
        return;
      default:
        return;
    }
  };
  // Re-subscribed every render, so the handler always sees the current state.
  useEffect(() => {
    const down = (e: KeyboardEvent) => onKey(e);
    const up = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') ctl.setReveal(false);
    };
    // A reveal never sticks: losing the window ends it (review M3-13).
    const hide = () => ctl.endReveal();
    const vis = () => document.visibilityState !== 'visible' && hide();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', vis);
    };
  });

  // Focus moves to the decision when one arrives (accessibility §3.2).
  const focusSignal = ctl.focusDecision;

  // flows F6.1: when you are attacked, say the attack and the maths once, assertively (M3-08).
  const battleKey =
    mine && (kind === 'block' || kind === 'counter') && view.battle
      ? `${view.turn.number}|${view.battle.attacker}|${view.battle.target}`
      : null;
  useEffect(() => {
    if (!battleKey || battleKey === lastBattleAnnounced.key) return;
    markAnnounced(battleKey);
    const b = view.battle!;
    const n = defenceNumbers(g, NO_STAGING);
    const target = n.leader ? 'your Leader' : nameOf(b.target);
    const opts = ctl.revealed() ? counterOptions(g, NO_STAGING) : new Map();
    const worth = [...opts.keys()].reduce((t, h) => t + (cardOf(h)?.card?.counter ?? 0), 0);
    const hand = ctl.revealed()
      ? opts.size === 0
        ? ' You have no Counter cards.'
        : ` You have ${opts.size} Counter ${opts.size === 1 ? 'card' : 'cards'} worth ${worth}.`
      : '';
    ctl.alert(
      `${nameOf(b.attacker)} attacks ${target}. ${nameOf(b.attacker)} ${n.ap}, ${target} ${n.tp}. ${n.hits ? `You need ${n.need} to stop it.` : 'It fails as things stand.'}${hand} Plan your defence.`,
    );
  });

  // Why-not popovers fade after 4 s (flows G4).
  useEffect(() => {
    if (!why) return;
    const t = setTimeout(() => setWhy(null), 4000);
    return () => clearTimeout(t);
  }, [why]);
  useEffect(() => {
    if (!ctl.toast) return;
    const t = setTimeout(() => ctl.clearToast(), 5000);
    return () => clearTimeout(t);
  }, [ctl, ctl.toast]);

  // ---------------- Preview dock timing (board.md §3.12) ----------------
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onPreview = (h: string | null, how: 'hover' | 'focus') => {
    clearTimeout(hoverTimer.current);
    if (dock.pinned) return;
    if (h === null) {
      hoverTimer.current = setTimeout(
        () =>
          setDock((d) =>
            d.pinned || d.how !== 'hover' ? d : { handle: null, pinned: false, how },
          ),
        150,
      );
      return;
    }
    if (!index.get(h)?.view.card) return;
    hoverTimer.current = setTimeout(
      () => setDock((d) => (d.pinned ? d : { handle: h, pinned: false, how })),
      how === 'hover' ? 250 : 400,
    );
  };

  // ---------------- Midline ----------------
  const turnWords =
    view.turn.phase === 'setup'
      ? 'Setup'
      : `Turn ${view.turn.number} · ${names.hotseat ? `${names.player[view.turn.activePlayer]}’s turn` : view.turn.activePlayer === me ? 'Your turn' : 'Opponent’s turn'}`;
  const midline = (
    <button
      type="button"
      className={`mid-turn ${view.turn.activePlayer === me ? 'you' : 'opp'}`}
      data-zone="mid"
      data-item={0}
      tabIndex={(roving['mid'] ?? 0) === 0 ? 0 : -1}
      onFocus={() => setRoving((r) => ({ ...r, mid: 0 }))}
    >
      <span className="sr-only">{`${turnWords}, ${view.battle ? `battle, ${view.turn.battleStep} step` : `${view.turn.phase} phase`}`}</span>
      <span
        className={`turn-words ${view.turn.activePlayer === me ? 'you' : 'opp'}`}
        aria-hidden="true"
      >
        {turnWords}
      </span>
      {view.turn.phase !== 'setup' && (
        <span className="vis-inline" aria-hidden="true">
          <PhaseStepper view={view} battle={!!view.battle} />
        </span>
      )}
    </button>
  );

  // ---------------- Arrow ----------------
  let arrow: { from: string; to: string; dashed: boolean; label?: string } | null = null;
  if (ui.kind === 'confirm') arrow = { from: ui.attacker, to: ui.target, dashed: true };
  else if (view.battle && !view.result) {
    const target =
      mine && kind === 'block' && staging.blocker ? staging.blocker : view.battle.target;
    arrow = { from: view.battle.attacker, to: target, dashed: false };
    if (view.battle.blocker || (mine && staging.blocker))
      arrow.label = `Blocked by ${nameOf(view.battle.blocker ?? staging.blocker!)}`;
  }

  const result = view.result;
  const banner = result
    ? 'winner' in result
      ? `${result.winner === me && !names.hotseat ? 'You win' : `${names.player[result.winner]} wins`} · Turn ${view.turn.number}`
      : `Draw · Turn ${view.turn.number}`
    : null;
  const boardLabel = `Game board, turn ${view.turn.number}, ${view.turn.activePlayer === me ? 'your' : 'opponent’s'} ${view.turn.phase === 'main' && view.battle ? 'battle' : view.turn.phase} phase`;

  const slots = { p1: ctl.session.characterSlots('p1'), p2: ctl.session.characterSlots('p2') };

  const rail = L.rail;
  const decTop = tall ? rail.tall.top : rail.decision.top;
  const parts = tall ? rail.tall.parts : rail.decision.parts;
  const logTop = rail.head + rail.notice;
  const logH = tall ? (rail.ticker > 0 ? rail.ticker : 0) : rail.decision.top - logTop;

  // The dock avoids the focused element, the battle's cards and every lit card (UX-V11).
  const dockRect = (() => {
    if (!dock.handle) return null;
    const avoid: Rect[] = [];
    const add = (el: Element | null | undefined) => {
      const r = el?.getBoundingClientRect();
      if (r && r.width) avoid.push({ x: r.x - 6, y: r.y - 6, w: r.width + 12, h: r.height + 12 });
    };
    add(
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : null,
    );
    add(document.querySelector(`[data-handle="${dock.handle}"]`));
    if (view.battle) {
      add(document.querySelector(`[data-handle="${view.battle.attacker}"]`));
      add(document.querySelector(`[data-handle="${view.battle.target}"]`));
    }
    // Every card, count and cost area stays visible, and the midline (review M3-15).
    document
      .querySelectorAll(
        '.board .bc, .board .plate, .board .costarea, .board .dondeck, .board .dplate',
      )
      .forEach((el) => add(el));
    avoid.push(L.mid);
    return placeDock(L, avoid, tall, dock.pinned);
  })();

  const lines = ctl.logLines();

  const style = {
    ['--card-w' as string]: `${L.card.w}px`,
    ['--card-h' as string]: `${L.card.h}px`,
    ['--rail-w' as string]: `${rail.w}px`,
  };

  // Count mode popover anchor.
  const countTarget = ui.kind === 'count' ? ui.target : null;

  return (
    <main
      className={`play ${L.density} ${L.rail.w < 320 ? 'narrow-rail' : ''}`}
      style={style}
      data-me={me}
    >
      {!L.supported ? (
        <SmallScreen onHome={onHome} />
      ) : (
        <>
          {/* Under the hotseat curtain nothing behind it is reachable or read (review M3-01, M3-07). */}
          <div className="stage-wrap" inert={ctl.curtainFor ? true : undefined}>
            <a
              className="skip-link"
              href="#decision"
              onClick={(e) => {
                e.preventDefault();
                focusDecision();
              }}
            >
              Skip to decision
            </a>
            <h1 className="sr-only">
              OPTCG Sim game: {names.player.p1} vs {names.player.p2}
            </h1>
            <Board
              view={view}
              L={L}
              cards={cards}
              names={names}
              legal={legal}
              slots={slots}
              deco={deco}
              roving={roving}
              onRove={(z, i) => setRoving((r) => (r[z] === i ? r : { ...r, [z]: i }))}
              onCard={(h, e: RMouseEvent<HTMLElement>) => {
                e.stopPropagation();
                activate(h, e.detail === 0);
              }}
              onCardKey={(_h, _e: RKeyboardEvent<HTMLElement>) => undefined}
              onPreview={onPreview}
              onCostArea={() => {
                if (!mine || kind !== 'main') return;
                if (legal.give.size === 0) {
                  const r = ctl.session.whyNot(me, {
                    type: 'giveDon',
                    target: view.zones[me].leader[0]!.handle,
                  });
                  if (r) setWhy({ text: r.text, at: null });
                  return;
                }
                setUi(ui.kind === 'don' ? { kind: 'idle' } : { kind: 'don' });
              }}
              onTrash={(p) => {
                rememberFocus();
                setDialog({ kind: 'trash', player: p });
              }}
              costLegal={
                mine &&
                kind === 'main' &&
                legal.give.size > 0 &&
                ui.kind !== 'target' &&
                ui.kind !== 'confirm'
              }
              donMode={ui.kind === 'don'}
              handHidden={ctl.hotseat ? (ctl.handHidden() ? ctl.handVeil : 'none') : 'none'}
              onShowHand={() => ctl.showHand()}
              onRevealSticky={() => ctl.setReveal(true, true)}
              onRevealStart={(id) => {
                ctl.setReveal(true);
                const end = (e: PointerEvent) => {
                  if (e.pointerId !== id) return;
                  ctl.setReveal(false);
                  window.removeEventListener('pointerup', end);
                  window.removeEventListener('pointercancel', end);
                };
                window.addEventListener('pointerup', end);
                window.addEventListener('pointercancel', end);
              }}
              mulligan={
                view.turn.phase === 'setup' &&
                view.zones[me].hand.length > 0 &&
                view.zones[me].life.length === 0
              }
              midline={midline}
              oppActivity={
                view.turn.activePlayer !== me
                  ? ctl.thinking
                    ? `${names.player[opp]} is thinking…`
                    : ctl.activity
                  : ''
              }
              oppThinking={ctl.thinking}
              arrow={arrow}
              banner={banner}
              label={boardLabel}
            />
            <div className="rail" style={{ left: rail.x, width: rail.w, height: L.H }}>
              <DecisionPanel g={g} top={decTop} parts={parts} focusSignal={focusSignal} />
              {ctl.toast && (
                <p className="toast" style={{ top: decTop - 34 }} role="status">
                  {ctl.toast}
                  {ctl.session.canForward && (
                    <button type="button" className="linkbtn" onClick={() => ctl.forward()}>
                      ⟳ Forward
                    </button>
                  )}
                </p>
              )}
              <div inert={dialog?.kind === 'trash' || (dock.pinned && dockOpen) ? true : undefined}>
                <GameLog
                  top={logTop}
                  height={logH}
                  lines={lines}
                  names={names}
                  ticker={tall}
                  onLink={() => undefined}
                  onRewindTo={(i) => requestRewind(() => ctl.rewindTo(i))}
                  canRewind={!view.result && ctl.canRewind()}
                />
              </div>
              <RailHeader
                top={0}
                height={rail.head}
                noticeH={rail.notice}
                turnChip={
                  view.turn.phase === 'setup'
                    ? 'Setup'
                    : result
                      ? 'Game over'
                      : names.hotseat
                        ? `${names.player[view.turn.activePlayer]}’s turn`
                        : view.turn.activePlayer === me
                          ? 'Your turn'
                          : 'Opponent’s turn'
                }
                myTurn={view.turn.activePlayer === me}
                menuOpen={dialog?.kind === 'menu'}
                onMenu={() => {
                  rememberFocus();
                  setDialog({ kind: 'menu' });
                }}
                onFullscreen={() => {
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
                }}
                onHome={onHome}
                rewound={ctl.session.rewound}
              />
            </div>
            {dock.handle && dockRect && (
              <CardDock
                g={g}
                handle={dock.handle}
                pinned={dock.pinned}
                rect={dockRect}
                onClose={() => {
                  setDock({ handle: null, pinned: false, how: 'hover' });
                  const back = focusMemory.el;
                  if (dock.pinned && back?.isConnected) back.focus();
                  else if (dock.pinned)
                    document.querySelector<HTMLElement>(`[data-handle="${dock.handle}"]`)?.focus();
                }}
              />
            )}
            {menuFor && index.get(menuFor) && (
              <ActionMenu
                g={g}
                handle={menuFor}
                onClose={(refocus) => {
                  setMenuFor(null);
                  if (refocus)
                    document.querySelector<HTMLElement>(`[data-handle="${menuFor}"]`)?.focus();
                }}
                onTarget={(h) => {
                  setMenuFor(null);
                  setUi({ kind: 'target', attacker: h });
                  const first = legal.attacks.get(h)?.[0];
                  if (first?.type === 'attack')
                    setTimeout(
                      () =>
                        document
                          .querySelector<HTMLElement>(`[data-handle="${first.target}"]`)
                          ?.focus(),
                      30,
                    );
                }}
                onCount={(h) => {
                  setMenuFor(null);
                  setUi({ kind: 'count', target: h, n: 1 });
                }}
              />
            )}
            {countTarget && ui.kind === 'count' && (
              <CountDialog
                g={g}
                target={countTarget}
                n={ui.n}
                setN={(n) => setUi({ kind: 'count', target: countTarget, n })}
                onClose={() => {
                  setUi({ kind: 'idle' });
                  document.querySelector<HTMLElement>(`[data-handle="${countTarget}"]`)?.focus();
                }}
              />
            )}
            {why && (
              <div
                className="whynot"
                role="status"
                style={
                  why.at
                    ? { left: Math.min(why.at.x, L.boardW - 300), top: Math.max(4, why.at.y - 40) }
                    : { left: L.axis - 150, top: L.mid.y - 44 }
                }
              >
                {why.text}
              </div>
            )}
            {goto && (
              <div className="goto" role="status" style={{ left: L.axis - 160, top: L.mid.y - 70 }}>
                Go to: <kbd>h</kbd> hand · <kbd>c</kbd> Characters · <kbd>l</kbd> Leader row ·{' '}
                <kbd>m</kbd> midline · <kbd>p</kbd> decision · <kbd>g</kbd> log · Shift for the
                opponent
              </div>
            )}
            <Dialogs
              g={g}
              dialog={dialog}
              lines={lines}
              onClose={() => {
                setDialog(null);
                const back = focusMemory.el;
                // After the dialog unmounts: a native dialog's close() moves focus itself (M3-25).
                requestAnimationFrame(() => {
                  if (back?.isConnected) back.focus();
                  else focusDecision();
                });
              }}
              setDialog={setDialog}
            />
          </div>
          {ctl.curtainFor && (
            <div
              className="curtain"
              role="dialog"
              aria-modal="true"
              aria-labelledby="curtain-title"
            >
              <div className="curtain-card">
                <h2 id="curtain-title">Pass to {names.player[ctl.curtainFor]}</h2>
                <p>
                  Both hands are hidden. {names.player[ctl.curtainFor]}: press Space when you are
                  ready.
                </p>
                <button
                  type="button"
                  className="btn primary big"
                  autoFocus
                  onClick={() => ctl.liftCurtain()}
                >
                  I’m {names.player[ctl.curtainFor]} · show my side <kbd>Space</kbd>
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <Announcer polite={ctl.polite} assertive={ctl.assertive} />
    </main>
  );
}

/** Which footer button Enter may press: only a safe commit (accessibility §3.10, C8). */
function primaryEnterId(g: G): string | null {
  if (!g.mine) return g.view.result ? 'rematch-btn' : null;
  const k = g.view.decision?.kind;
  if (k === 'block' || k === 'counter')
    return document.getElementById('commit-defence') ? 'commit-defence' : null;
  if (k === 'trigger') return 'trigger-hand';
  if (k === 'choose') return 'choose-done';
  if (k === 'main' && g.ui.kind === 'confirm') return 'confirm-attack';
  return null;
}

// ---------------------------------------------------------------------------------------------
// The action menu (accessibility §3.4) and the Count dialog (§3.6)
// ---------------------------------------------------------------------------------------------

function anchorOf(handle: string): DOMRect | null {
  return document.querySelector(`[data-handle="${handle}"]`)?.getBoundingClientRect() ?? null;
}

function placeBeside(
  r: DOMRect | null,
  w: number,
  h: number,
  boardW: number,
): { left: number; top: number } {
  if (!r) return { left: 16, top: 40 };
  const right = r.right + 12;
  const left = right + w <= boardW ? right : Math.max(4, r.left - 12 - w);
  const top = Math.max(4, Math.min(r.top, window.innerHeight - h - 8));
  return { left, top };
}

function ActionMenu({
  g,
  handle,
  onClose,
  onTarget,
  onCount,
}: {
  g: G;
  handle: string;
  onClose: (refocus: boolean) => void;
  onTarget: (h: string) => void;
  onCount: (h: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = placeBeside(anchorOf(handle), 260, 200, g.L.boardW);
  useLayoutEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
      ?.focus();
  }, [handle, g.L.boardW]);
  const c = g.cardOf(handle);
  const items: { label: string; key?: string; run?: () => void; disabled?: string }[] = [];
  const play = g.legal.play.get(handle);
  if (g.mine && g.legal.kind === 'main') {
    if (play)
      items.push({
        label: `▶ Play · rest ${c?.card?.cost ?? 0} DON!!`,
        key: 'P',
        run: () => g.act(play),
      });
    else if (c?.zone === 'hand' && c.owner === g.me) {
      const r = g.ctl.session.whyNot(g.me, { type: 'playCard', card: handle });
      items.push({
        label: 'Play',
        disabled: r ? `${r.text}${r.rule ? ` (${r.rule})` : ''}` : 'Not now',
      });
    }
    if (g.legal.attacks.has(handle))
      items.push({ label: '⚔ Attack…', key: 'A', run: () => onTarget(handle) });
    else if (c && c.owner === g.me && (c.zone === 'characters' || c.zone === 'leader')) {
      const r = g.ctl.session.whyNot(g.me, {
        type: 'attack',
        attacker: handle,
        target: g.view.zones[g.opp].leader[0]!.handle,
      });
      if (r) items.push({ label: 'Attack', disabled: r.text });
    }
    if (g.legal.give.has(handle))
      items.push({ label: '◆ Give DON!!…', key: '+', run: () => onCount(handle) });
  }
  if (c?.card) items.push({ label: 'Inspect', key: 'I', run: () => g.openInspector(handle) });
  const run = (i: (typeof items)[number]) => {
    if (i.disabled || !i.run) return;
    onClose(false);
    i.run();
  };
  return (
    <div
      ref={ref}
      className="popmenu"
      role="menu"
      aria-label={`Actions for ${g.nameOf(handle)}`}
      style={pos}
      onKeyDown={(e) => {
        const els = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
        const i = els.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose(true);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          els[(i + (e.key === 'ArrowDown' ? 1 : els.length - 1)) % els.length]?.focus();
        } else if (e.key === 'Tab') {
          onClose(false);
        } else {
          const hit = items.find((x) => x.key && x.key.toLowerCase() === e.key.toLowerCase());
          if (hit) {
            e.preventDefault();
            e.stopPropagation();
            run(hit);
          }
        }
      }}
    >
      <div className="ph">{g.nameOf(handle)}</div>
      {items.map((i) => (
        <button
          key={i.label}
          type="button"
          role="menuitem"
          className="mi"
          aria-disabled={i.disabled ? true : undefined}
          onClick={() => run(i)}
        >
          <span>
            {i.label}
            {i.disabled && <span className="mi-why">: {i.disabled}</span>}
          </span>
          {i.key && <kbd>{i.key}</kbd>}
        </button>
      ))}
    </div>
  );
}

function CountDialog({
  g,
  target,
  n,
  setN,
  onClose,
}: {
  g: G;
  target: string;
  n: number;
  setN: (n: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const max = g.view.don[g.me].active;
  const c = g.cardOf(target);
  const pos = placeBeside(anchorOf(target), 280, 150, g.L.boardW);
  useLayoutEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
  }, [target, g.L.boardW]);
  const give = () => {
    const a = g.legal.give.get(target);
    if (!a) return;
    const id = donIntent(target);
    g.ctl.actSequence(
      Array.from({ length: n }, () => a),
      id,
    );
    resetDonIntent();
    onClose();
  };
  const name = c?.zone === 'leader' ? 'your Leader' : g.nameOf(target);
  return (
    <div
      ref={ref}
      className="popmenu count"
      role="dialog"
      aria-label={`Give DON!! to ${name}`}
      style={pos}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          give();
        } else if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
          e.preventDefault();
          setN(Math.min(max, n + 1));
        } else if (e.key === 'ArrowDown' || e.key === '-') {
          e.preventDefault();
          setN(Math.max(1, n - 1));
        } else if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          setN(Math.min(max, Number(e.key)));
        }
      }}
    >
      <div className="ph">Give DON!! to {name}</div>
      <div className="row">
        <button
          type="button"
          className="btn small"
          aria-label="One fewer"
          onClick={() => setN(Math.max(1, n - 1))}
        >
          −
        </button>
        <span
          role="spinbutton"
          tabIndex={0}
          aria-valuemin={1}
          aria-valuemax={max}
          aria-valuenow={n}
          aria-valuetext={`${n}: ${name} ${num((c?.power ?? 0) + n * 1000)}`}
          aria-label={`DON!! to give, ${n} of ${max} active`}
          className="spin num"
        >
          {n}
        </span>
        <button
          type="button"
          className="btn small"
          aria-label="One more"
          onClick={() => setN(Math.min(max, n + 1))}
        >
          +
        </button>
        <span className="subtle">of {max}</span>
      </div>
      <p className="small" aria-live="polite">
        {name}: {num(c?.power)} → {num((c?.power ?? 0) + n * 1000)} this turn
      </p>
      <div className="row">
        <button type="button" className="btn small" onClick={onClose}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="button" className="btn small primary" onClick={give}>
          Give {n} <kbd>Enter</kbd>
        </button>
      </div>
    </div>
  );
}

function SmallScreen({ onHome }: { onHome: () => void }) {
  return (
    <main className="small-screen">
      <h1>The board needs a bigger screen</h1>
      <p>Games are played on a tablet or computer (at least 968 × 590).</p>
      <button type="button" className="btn primary" onClick={onHome}>
        Back to Home
      </button>
    </main>
  );
}

/** Two live regions from load, never removed (accessibility §9.3); polite alternates two nodes. */
function Announcer({
  polite,
  assertive,
}: {
  polite: { text: string; seq: number };
  assertive: { text: string; seq: number };
}) {
  const a = polite.seq % 2 === 0;
  return (
    <>
      <div id="announce-polite" className="sr-only" role="status" aria-live="polite">
        <span>{a ? polite.text : ''}</span>
        <span>{a ? '' : polite.text}</span>
      </div>
      <div id="announce-assertive" className="sr-only" role="alert">
        {assertive.text}
      </div>
    </>
  );
}

export { commitDefence, defendingTarget };
