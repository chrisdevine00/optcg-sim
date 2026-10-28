/*
 * OPTCG Sim wireframes: board renderer, keyboard model and page helpers.
 * Geometry: board.md §3.1 (1280×720, compact) and §3.2 (1920×1080, roomy). Values are copied, not derived.
 * Rail states: board.md §3.9 (decision tall) and §3.13 (coach collapsed, open, tall).
 * Keyboard: accessibility.md §3.1 (one tab stop per zone, roving arrows) and §3.3–§3.14 (P, G, A, +, E, U).
 * No card art is ever loaded. Art is a labelled placeholder inside the art-window frame (card-face-study.md, treatment C).
 */
(function () {
  'use strict';

  const G = {
    compact: {
      W: 1280, H: 720, card: [84, 117], slot: 117, tok: [24, 34], axis: 480, handGap: 8, handMax: 10,
      oppId: [16, 0, 238, 32], oppHand: [270, 0, 420, 32],
      oppDonDeck: [20, 49, 60, 100], oppCost: [88, 40, 185, 117], oppLife: [289, 40, 117, 117],
      oppLeader: [422, 40, 117, 117], oppStage: [555, 40, 117, 117], oppDeck: [768, 40, 84, 117], oppTrash: [860, 40, 84, 117],
      charX: [172, 297, 422, 547, 672], oppCharY: 165, myCharY: 338,
      mid: [16, 290, 928, 40], midCentre: [220, 740],
      myDonDeck: [20, 472, 60, 100], myCost: [88, 463, 185, 117], myLife: [289, 463, 117, 117],
      myLeader: [422, 463, 117, 117], myStage: [555, 463, 117, 117], myDeck: [768, 463, 84, 117], myTrash: [860, 463, 84, 117],
      myHand: [16, 592, 928, 117],
      mat: [0, 0, 960, 720],
      rail: [960, 0, 320, 720], railHead: 44, notice: [44, 32],
      // [top, height] per rail section; parts = decision header / body / footer (board.md §3.1, §3.9, §3.13)
      modes: {
        collapsed: { log: [76, 348], coach: [424, 48], dec: [472, 248], parts: [36, 148, 64] },
        open: { log: [76, 152], coach: [228, 244], dec: [472, 248], parts: [36, 148, 64] },
        tall: { log: [76, 76], coach: [152, 468], dec: [620, 100], parts: [36, 0, 64] },
        dtall: { log: [76, 76], coach: [152, 48], dec: [200, 520], parts: [36, 420, 64] },
      },
      decision: [472, 248], // default decision panel [top, height], for page overlays
      dock: [872, 8, 400, 456],
    },
    roomy: {
      W: 1920, H: 1080, card: [126, 176], slot: 176, tok: [36, 51], axis: 760, handGap: 8, handMax: 11,
      oppId: [24, 0, 397, 48], oppHand: [445, 0, 630, 48],
      oppDonDeck: [68, 77, 91, 143], oppCost: [171, 60, 277, 176], oppLife: [472, 60, 176, 176],
      oppLeader: [672, 60, 176, 176], oppStage: [872, 60, 176, 176], oppDeck: [1232, 60, 126, 176], oppTrash: [1370, 60, 126, 176],
      charX: [296, 484, 672, 860, 1048], oppCharY: 248, myCharY: 504,
      mid: [24, 436, 1472, 56], midCentre: [500, 1020],
      myDonDeck: [68, 709, 91, 143], myCost: [171, 692, 277, 176], myLife: [472, 692, 176, 176],
      myLeader: [672, 692, 176, 176], myStage: [872, 692, 176, 176], myDeck: [1232, 692, 126, 176], myTrash: [1370, 692, 126, 176],
      myHand: [24, 884, 1472, 176],
      mat: [0, 0, 1520, 1080],
      rail: [1520, 0, 400, 1080], railHead: 56, notice: [56, 32],
      modes: {
        collapsed: { log: [88, 608], coach: [696, 48], dec: [744, 336], parts: [44, 220, 72] },
        open: { log: [88, 288], coach: [376, 368], dec: [744, 336], parts: [44, 220, 72] },
        tall: { log: [88, 80], coach: [168, 796], dec: [964, 116], parts: [44, 0, 72] },
        dtall: { log: [88, 80], coach: [168, 48], dec: [216, 864], parts: [44, 748, 72] },
      },
      decision: [744, 336],
      dock: [1432, 8, 480, 728],
    },
  };

  // Keyword plates: a glyph at compact density (word in tooltip, name and legend), a short word at roomy (board.md §2.3)
  const KW = {
    blocker: ['⛨', 'Blocker', 'Blocker'], rush: ['»', 'Rush', 'Rush'], rushc: ['»C', 'Rush: Character', 'Rush: C'], double: ['×2', 'Double Attack', 'Double'],
    banish: ['⊘', 'Banish', 'Banish'], unblockable: ['⤳', 'Unblockable', 'Unblockable'], trigger: ['T', 'Trigger', 'Trigger'],
  };
  const GLYPH = { play: ['▶', 'can be played'], attack: ['⚔', 'can attack'], don: ['◆', 'can receive DON!!'], target: ['⌖', 'can be targeted'], ability: ['⚡', 'ability ready'], pick: ['✓', 'chosen'] };
  const COLOURS = { blue: 'Blue', purple: 'Purple', red: 'Red', green: 'Green', yellow: 'Yellow', black: 'Black' };
  const DISCLAIMER_SHORT = 'Unofficial fan tool. Not affiliated with or endorsed by Bandai, Shueisha or Toei Animation.';
  const DISCLAIMER = DISCLAIMER_SHORT + ' One Piece and all card names, text and art belong to their respective owners.';

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const px = (r) => `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px`;

  function isRoomy() { return window.matchMedia('(min-width: 1600px) and (min-height: 900px)').matches; }

  /* ---------- Card ---------- */
  function cardHTML(c, rect, g, o = {}) {
    // rect = slot or position box [x, y, w, h]; the card's bounding box is centred inside it.
    const [cw, ch] = g.card;
    const roomy = (g.W || 0) > 1600;
    const bw = c.r ? ch : cw, bh = c.r ? cw : ch;
    const x = rect[0] + (rect[2] - bw) / 2, y = rect[1] + (rect[3] - bh) / 2;
    const st = c.st || [];
    const cls = ['card', `c-${c.col || 'blue'}`, c.r ? 'rested' : '', c.inHand ? 'inhand' : '', ...st].filter(Boolean).join(' ');
    const base = c.base ?? c.p;
    let pow = '';
    if (c.timing) pow = `<span class="b timing">${esc(c.timing)}</span>`;
    else if (c.p !== undefined && c.p !== null) {
      const dir = c.p > base ? 'buff' : c.p < base ? 'debuff' : '';
      const ar = dir === 'buff' ? '<span class="ar" aria-hidden="true">▲</span>' : dir === 'debuff' ? '<span class="ar" aria-hidden="true">▼</span>' : '';
      pow = `<span class="b pow ${dir}">${String(c.p).replace('-', '−')}${ar}</span>`;
    }
    const costDir = c.costBase !== undefined ? (c.cost > c.costBase ? 'buff' : c.cost < c.costBase ? 'debuff' : '') : '';
    const cost = c.cost !== undefined && c.cost !== null ? `<span class="b cost ${costDir}">${c.cost}</span>` : '';
    // DON!! and keyword badges sit at the art window's bottom edge; on rested cards they move to the art-side corner.
    const bh2 = `var(--badge-h)`;
    const winBottom = c.r ? `bottom:var(--badge-inset)` : `top:calc(${ch * 0.58}px - ${bh2} - var(--badge-inset))`;
    const don = c.don ? `<span class="b don ${c.donOff ? 'off' : ''}" style="${winBottom};${c.r ? `left:auto;right:calc(var(--badge-inset) + ${(c.kw && c.kw.length) ? 'var(--badge-h) + 4px' : '0px'})` : ''}"><span class="d" aria-hidden="true">◆</span>${c.don}</span>` : '';
    let kw = '';
    if (c.kw && c.kw.length) {
      const shown = roomy ? KW[c.kw[0]][2] : c.kw.slice(0, 2).map((k) => KW[k][0]).join(' ');
      const more = roomy ? (c.kw.length > 1 ? ` +${c.kw.length - 1}` : '') : (c.kw.length > 2 ? ` +${c.kw.length - 2}` : '');
      kw = `<span class="b kw ${roomy ? 'word' : ''}" style="${winBottom}" title="${esc(c.kw.map((k) => KW[k][1]).join(', '))}">${shown}${more}</span>`;
    }
    const ctr = c.ctr ? `<span class="b ctr">${esc(c.ctr)}</span>` : '';
    const glyph = c.g ? `<span class="glyph" aria-hidden="true">${GLYPH[c.g][0]}</span>` : '';
    // Chip slots (board.md §2.3): upright cards use the art window's middle band; rested cards the band below.
    // 'top' is kept as an alias of 'mid'. One chip per slot: callers merge ("New" already means "can't attack").
    const slotOf = (p) => (c.r ? (p === 'mid' || p === 'top' || !p ? 'below' : p) : (p === 'top' || !p ? 'mid' : p));
    let chipsList = (c.chips || []).map((x) => ({ ...x, pos: slotOf(x.pos) }));
    if (c.r && !c.noRestChip) {
      const below = chipsList.find((x) => x.pos === 'below');
      if (below) below.t = '⟳ Rested · ' + below.t;
      else chipsList = [{ t: '⟳ Rested', pos: 'below', hidden: true }, ...chipsList];
    }
    const chips = chipsList.map((x) => `<span class="cchip ${x.cls || ''} ${x.pos}" ${x.hidden ? 'aria-hidden="true"' : ''}>${x.t}</span>`).join('');
    const peek = c.don ? `<span class="don-peek" aria-hidden="true">${'<i></i>'.repeat(Math.min(3, c.don))}</span>` : '';
    const label = c.aria || autoName(c);
    const tag = o.tag || 'button';
    const mine = c.who === 'Your' || c.inHand || c.mine;
    return `<${tag} class="${cls}" ${c.id ? `id="${c.id}"` : ''} style="left:${x}px;top:${y}px;width:${bw}px;height:${bh}px" aria-label="${esc(label)}" ${tag === 'button' ? 'type="button"' : 'role="img"'} data-name="${esc(c.n)}" data-g="${c.g || ''}" ${mine ? 'data-mine="1"' : ''}>
      ${peek}<span class="face" aria-hidden="true"><span class="art"><span class="al">art</span></span><span class="foot"><span class="nm">${esc(c.n).replace(/\.(?=\S)/g, '.​')}</span><span class="band"><span class="ini">${esc((c.colInit) || (COLOURS[c.col || 'blue'] || '')[0])}</span></span></span></span>
      ${cost}${pow}${don}${kw}${ctr}${glyph}${chips}</${tag}>`;
  }
  function autoName(c) {
    const bits = [c.who ? `${c.who} ${c.n}` : c.n];
    if (c.kind) bits.push(c.kind);
    if (!c.inHand) bits.push(c.r ? 'rested' : 'active');
    if (c.timing) bits.push(c.timing.replace(/[[\]]/g, '') + ' Event');
    if (c.p !== undefined && c.p !== null && !c.timing) bits.push(`${c.p} power`);
    if (c.cost !== undefined && c.inHand) bits.push(`cost ${c.cost}`);
    if (c.ctr) bits.push(`Counter ${c.ctr}`);
    if (c.don) bits.push(`${c.don} DON!! given${c.donOff ? ', no power on opponent’s turn' : ''}`);
    if (c.kw) bits.push(c.kw.map((k) => KW[k][1]).join(', '));
    if (c.g) bits.push(GLYPH[c.g][1]);
    (c.chips || []).forEach((x) => bits.push(String(x.t).replace(/<[^>]+>/g, '')));
    if (c.col) bits.push(COLOURS[c.col]);
    return bits.join(', ');
  }

  /* ---------- Zones ---------- */
  function backs(n, rect, g, mine) {
    // Life: landscape backs in a square box, top of pile nearest the midline (board.md §3.3)
    const [cw] = g.card; const lw = rect[2] - 8, lh = Math.round(cw * 0.92);
    const d = n > 1 ? Math.min(cw * 0.1, (rect[3] - 8 - lh) / (n - 1)) : 0;
    let h = '';
    for (let i = 0; i < n; i++) {
      // i = 0 is the top of the pile
      const yy = mine ? rect[1] + 4 + i * d : rect[1] + rect[3] - 4 - lh - i * d;
      h = `<span class="back" style="left:${rect[0] + 4}px;top:${yy}px;width:${lw}px;height:${lh}px;z-index:${10 - i}" aria-hidden="true"></span>` + h;
    }
    return h;
  }

  // Cost area (board.md §3.4, UX-R4): the active count is the largest DON!! number on each side.
  function costArea(side, rect, g, p) {
    const [tw, th] = g.tok;
    const roomy = g === G.roomy;
    const labW = roomy ? 84 : 58;
    const inner = rect[2] - labW - 6;
    const rowTok = (n, w, gap) => (n <= 1 ? 0 : Math.min(w + gap, (inner - w) / (n - 1)));
    const aTop = roomy ? 8 : 5, rTop = aTop + th + (roomy ? 10 : 7), gTop = rTop + tw + (roomy ? 10 : 7);
    const given = p.given ?? 0;
    const L = side === 'me' ? 'Your' : 'Opponent’s';
    let h = `<div class="z costarea zitem" role="group" aria-label="${L} cost area: ${p.active} active, ${p.rested} rested${given ? `, ${given} given to cards` : ''}" style="${px(rect)}">`;
    h += `<button type="button" class="rowbtn ${p.donLegal ? 'legal' : ''}" style="top:${aTop - 3}px;height:${th + 6}px" aria-label="${p.active} active DON!!${p.donLegal ? ', select to give DON!!' : ''}">${p.donLegal ? '<span class="glyph" aria-hidden="true">◆</span>' : ''}</button>`;
    h += `<span class="dl act" style="top:${aTop}px;width:${labW}px;height:${th}px" aria-hidden="true"><b class="dn">${p.active}</b><span>active</span></span>`;
    const pa = rowTok(p.active, tw, 1);
    for (let i = 0; i < p.active; i++) h += `<span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${labW + i * pa}px;top:${aTop}px" aria-hidden="true">◆</span>`;
    h += `<span class="dl rest" style="top:${rTop - (roomy ? 4 : 3)}px;width:${labW}px;height:${tw + (roomy ? 8 : 6)}px" aria-hidden="true"><b>⟳ ${p.rested}</b><span>rested</span></span>`;
    const pr = rowTok(p.rested, th, 2);
    for (let i = 0; i < p.rested; i++) h += `<span class="tok r" style="--tok-w:${tw}px;--tok-h:${th}px;left:${labW + i * pr}px;top:${rTop}px" aria-hidden="true">◆</span>`;
    h += `<span class="dl given" style="top:${gTop}px" aria-hidden="true">${given ? `+${given} given to cards` : 'none given'}</span>`;
    if (p.donMode) h += `<span class="cchip don below" style="top:calc(100% + 2px)">◆ Giving DON!!</span>`;
    return h + '</div>';
  }

  function deckZone(label, n, rect, g, warn) {
    return `<div class="z zitem" role="group" aria-label="${label}, ${n} cards" style="${px(rect)}"><span class="back" style="left:0;top:0;width:100%;height:100%"></span>
      <span class="plate ${warn ? 'warn' : ''}" style="right:4px;bottom:4px">${n} <small>${warn ? '⚠ ' : ''}Deck</small></span></div>`;
  }
  // DON!! deck: caption weight, so it never reads as "DON!! you have" (UX-R4)
  function donDeck(label, n, rect, g) {
    const [tw, th] = g.tok;
    return `<div class="z zitem" role="group" aria-label="${label}, ${n} DON!!" style="${px(rect)}">
      <span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${(rect[2] - tw) / 2 - 3}px;top:6px;opacity:.55" aria-hidden="true"></span>
      <span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${(rect[2] - tw) / 2}px;top:10px;opacity:.8" aria-hidden="true"></span>
      <span class="dplate" aria-hidden="true"><span>DON!! deck</span><b>${n}</b></span></div>`;
  }
  function trashZone(label, t, rect, g) {
    let h = `<div class="z zitem" role="group" aria-label="${label}, ${t.n} cards${t.top ? ', top: ' + t.top.n : ''}" style="${px(rect)}">`;
    if (t.top) h += cardHTML({ ...t.top, cost: undefined, p: undefined, timing: undefined, kw: undefined, aria: `${label}, ${t.n} cards, top: ${t.top.n}. Open trash viewer` }, [0, 0, rect[2], rect[3]], g);
    else h += `<span class="slot empty" style="left:0;top:0;width:100%;height:100%"><span class="zlabel">Trash</span></span>`;
    h += `<span class="plate" style="left:2px;top:2px;z-index:6">${t.n} <small>Trash</small></span></div>`;
    return h;
  }
  function lifeZone(label, n, rect, g, mine) {
    if (n === null) return `<div class="z slot empty zitem" role="group" aria-label="${label}, not placed yet" style="${px(rect)}"><span class="zlabel">Life · placed after the mulligan</span></div>`;
    if (n === 0) return `<div class="z slot empty zitem" role="group" aria-label="${label}, 0 Life, next hit loses" style="${px(rect)};border-color:var(--color-warning)"><span class="plate warn" style="position:static">⚠ 0 <small>Life · next hit loses</small></span></div>`;
    return `<div class="z zitem" role="group" aria-label="${label}, ${n} cards, face down" style="${px(rect)}">${backs(n, [0, 0, rect[2], rect[3]], g, mine)}
      <span class="plate life" style="right:2px;bottom:${mine ? 2 : 'auto'}px;${mine ? '' : 'top:2px;'}z-index:12">${n} <small>Life</small></span></div>`;
  }
  function slotHTML(c, rect, g, label, emptyLabel) {
    if (!c) return `<div class="slot empty zitem" style="${px(rect)}" role="group" aria-label="${label}, empty">${emptyLabel ? `<span class="zlabel">${emptyLabel}</span>` : ''}</div>`;
    return `<div class="slot zitem" style="${px(rect)}" role="group" aria-label="${label}">${cardHTML(c, [0, 0, rect[2], rect[3]], g)}</div>`;
  }

  /* ---------- Midline ---------- */
  function midline(m, g) {
    const r = g.mid; const c0 = g.midCentre[0] - r[0], c1 = g.midCentre[1] - r[0];
    const B = ['Attack', 'Block', 'Counter', 'Damage'];
    const steps = m.battle
      ? [['Main', 'past'], ['Battle:', 'grp'], ...B.map((s) => [s, s === m.battle ? 'cur' : (B.indexOf(s) < B.indexOf(m.battle) ? 'past' : 'fut')])]
      : ['Refresh', 'Draw', 'DON!!', 'Main', 'End'].map((s, i, a) => [s, s === m.phase ? 'cur' : (i < a.indexOf(m.phase) ? 'past' : 'fut')]);
    const lis = [];
    steps.forEach(([s, k], i) => {
      if (i && k !== 'grp' && steps[i - 1][1] !== 'grp') lis.push('<li class="sep" aria-hidden="true">›</li>');
      if (k === 'grp') { lis.push('<li class="sep" aria-hidden="true">›</li>'); lis.push(`<li class="grp">${s}</li>`); return; }
      lis.push(`<li class="${k === 'cur' ? 'cur' + (m.opp ? ' opp' : '') : k === 'fut' ? 'fut' : ''}" ${k === 'cur' ? 'aria-current="step"' : ''}>${k === 'cur' ? '▸ ' : ''}${s}</li>`);
    });
    const label = `${String(m.turn || '').replace(/<[^>]+>/g, '')}. Phase: ${m.battle ? 'Battle, ' + m.battle + ' step' : (m.phase || '')}`;
    return `<div class="z midline zitem" style="${px(r)}" role="group" aria-label="${esc(label)}">
      <div class="ml-left">${m.left || ''}</div>
      <div class="ml-centre" style="left:${c0}px;width:${c1 - c0}px">${m.oppTag ? '<span class="chip opp">Opponent</span>' : ''}<span class="turnword">${m.turn}</span><ol class="steps" aria-label="Phase">${lis.join('')}</ol></div>
      <div class="ml-right">${m.right || ''}</div></div>`;
  }

  /* ---------- Rail ---------- */
  function railHead(g, cfg) {
    const opp = cfg.mid && cfg.mid.opp;
    const turn = cfg.turnChip === false ? '' : (cfg.turnChip || (opp ? '<span class="chip opp turnchip">Opponent’s turn</span>' : '<span class="chip you turnchip">Your turn</span>'));
    const inner = cfg.railHeadHtml || `${turn}<span class="grow"></span>
      <button class="iconbtn" type="button" aria-label="Game menu: Concede, Rematch, Settings, Keyboard shortcuts" title="Game menu">≡</button>
      <a class="iconbtn lbl" href="16-settings.html#rules" aria-label="Rules reference">Rules</a>
      <a class="iconbtn" href="16-settings.html" aria-label="Settings" title="Settings">⚙</a>
      <button class="iconbtn" type="button" aria-label="Fullscreen" title="Fullscreen">⤢</button>
      <a class="iconbtn" href="index.html" aria-label="Wireframe index (not product UI)" title="Wireframe index (not product UI)">⌂</a>`;
    const [nt, nh] = g.notice;
    // Rail notice (board.md §3.1, C15): the board's footer equivalent. Visible two-line text; full text as the name.
    return `<div class="railsec railhead" style="top:0;height:var(--rh)">${inner}</div>
      <div class="railsec railnotice" role="note" aria-label="${esc(DISCLAIMER)}" style="top:${nt}px;height:${nh}px"><p>${DISCLAIMER_SHORT}</p><button class="info" type="button" aria-label="Full disclaimer: ${esc(DISCLAIMER)}" title="${esc(DISCLAIMER)}">ⓘ</button></div>`;
  }
  function logHTML(lines, top, h, ticker) {
    return `<section class="railsec log ${ticker ? 'ticker' : ''}" style="top:${top}px;height:${h}px" aria-label="Event log">
      <div class="lh" ${ticker ? 'hidden' : ''}><span>Event log</span><span class="subtle" style="font-weight:500">newest at bottom</span></div>
      <div role="log" aria-live="off" aria-label="Game history" class="logbody"><ol>${(lines || []).map((l) => (l.startsWith('<li') ? l : `<li>${l}</li>`)).join('')}</ol></div></section>`;
  }
  // Coach strip (UX-R23): one word per button, the live state as a badge (board.md §3.13, learning-ui §2.1)
  function coachStrip(s = {}) {
    const QUIET = ['ask', 'last move', 'Ask me', 'on', '—', 'frozen', ''];
    const labels = { hint: 'Hint', why: 'Why', lethal: 'Lethal', don: 'Math', tempo: 'Tempo', ...(s.labels || {}) };
    const names = { hint: 'Hint', why: 'Why did they do that', lethal: 'Lethal check', don: 'DON!! math', tempo: 'Tempo meter' };
    const icons = { hint: '✦', why: '↶', lethal: '⚔', don: '∑', tempo: '◔' };
    const keys = { hint: 'H', why: 'W', lethal: 'L', don: 'M', tempo: '' };
    const hide = s.hide || [];
    const b = (k) => {
      if (hide.includes(k)) return '';
      let v = s[k] ?? ''; if (QUIET.includes(v)) v = '';
      v = String(v).replace(' of ', '/');
      const cls = s[k + 'Cls'] || '';
      const kk = keys[k] ? ` (${keys[k]})` : '';
      const nm = (s.labels && s.labels[k]) || names[k];
      return `<button type="button" class="cbtn ${cls}" aria-label="${nm}${v ? ': ' + v.replace(/<[^>]+>/g, '') : ''}${kk}" title="${nm}${kk}"><span class="ic" aria-hidden="true">${icons[k]}</span><span class="t">${labels[k]}</span>${v ? `<span class="bdg ${cls === 'alert' ? '' : 'neutral'}" aria-hidden="true">${v}</span>` : ''}</button>`;
    };
    return `<div class="coachstrip" role="toolbar" aria-label="Coach">${['hint', 'why', 'lethal', 'don', 'tempo'].map(b).join('')}
      <button type="button" class="cbtn chev" aria-label="Open coach (C)" aria-expanded="false" title="Open coach (C)"><span class="ic" aria-hidden="true">▴</span><span class="t"><kbd>C</kbd></span></button></div>`;
  }
  function coachHTML(cfg, top, h, mode) {
    if (mode === 'collapsed' || mode === 'dtall') return `<aside class="railsec coach" style="top:${top}px;height:${h}px" aria-label="Coach">${coachStrip(cfg.coachStrip)}</aside>`;
    return `<aside class="railsec coach ${mode}" style="top:${top}px;height:${h}px" aria-label="Coach">
      <div class="row chead"><b style="font-size:var(--text-sm)">Coach</b><span class="chip outline">${cfg.verbosity || 'Standard'}</span>${mode === 'tall' ? '<span class="subtle" style="font-size:12px">tall · you asked</span>' : ''}<span style="margin-left:auto"></span><button class="iconbtn" type="button" aria-label="Collapse coach (C)" aria-expanded="true" title="Collapse coach (C)">▾</button></div>
      <div class="coachbody">${cfg.coachHtml || ''}</div></aside>`;
  }
  function decisionHTML(d, top, h, parts, mode) {
    const [hh, bh, fh] = parts;
    return `<section class="railsec decision ${mode}" id="decision" style="top:${top}px;height:${h}px" aria-label="Decision panel: ${esc(String(d.title || '').replace(/<[^>]+>/g, ''))}">
      <div class="dhead" style="height:${hh}px"><h2>${d.title}</h2>${d.q === false ? '' : '<button class="q" type="button" aria-label="Explain this step" title="Explain this step">?</button>'}</div>
      ${bh ? `<div class="dbody" style="height:${bh}px">${d.body || ''}</div>` : ''}
      <div class="dfoot" style="height:${fh}px">${d.foot || ''}</div></section>`;
  }

  /* ---------- Arrows ---------- */
  function arrowSVG(list, R, W, H) {
    if (!list || !list.length) return '';
    const centre = (k) => { const r = R[k]; return r ? [r[0] + r[2] / 2, r[1] + r[3] / 2] : null; };
    let paths = '';
    list.forEach((a, i) => {
      const f = centre(a.from), t = centre(a.to);
      if (!f || !t) return;
      // Arrows end at the ⌖ in the lower half of the target, below its power plate (UX-R13)
      t[1] += (a.endLow ?? 14); t[0] += (a.endDx || 0);
      const col = a.color === 'opp' ? 'var(--color-opponent)' : a.ghost ? 'var(--color-text-muted)' : 'var(--color-attack)';
      const mx = (f[0] + t[0]) / 2 + (a.bend || 0), my = (f[1] + t[1]) / 2;
      const dx = t[0] - mx, dy = t[1] - my, L = Math.hypot(dx, dy) || 1, cut = a.cut ?? 30;
      const tx = t[0] - (dx / L) * cut, ty = t[1] - (dy / L) * cut;
      paths += `<defs><marker id="ah${i}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker></defs>
        <path d="M${f[0]},${f[1]} Q${mx},${my} ${tx},${ty}" fill="none" stroke="${col}" stroke-width="${a.ghost ? 3 : 4}" stroke-linecap="round" ${a.dashed || a.ghost ? 'stroke-dasharray="10 8"' : ''} marker-end="url(#ah${i})"/>
        <circle cx="${t[0]}" cy="${t[1]}" r="13" fill="var(--color-plate)" stroke="${col}" stroke-width="2"/><text x="${t[0]}" y="${t[1] + 5}" text-anchor="middle" fill="${col}" font-size="16" font-weight="700">${a.num ?? '⌖'}</text>`;
      if (a.label) {
        const tt = a.labelAt ?? 0.5, lx = (1 - tt) ** 2 * f[0] + 2 * (1 - tt) * tt * mx + tt * tt * tx, ly = (1 - tt) ** 2 * f[1] + 2 * (1 - tt) * tt * my + tt * tt * ty;
        paths += `<g><rect x="${lx - a.label.length * 3.6 - 8}" y="${ly - 12}" width="${a.label.length * 7.2 + 16}" height="22" rx="4" fill="var(--color-plate)" stroke="${col}"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="Inter, system-ui">${esc(a.label)}</text></g>`;
      }
    });
    return `<svg class="arrows" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${paths}</svg>`;
  }

  /* ---------- Board ---------- */
  function renderBoard(el, cfg, opt = {}) {
    const roomy = opt.density ? opt.density === 'roomy' : isRoomy();
    const g = roomy ? G.roomy : G.compact;
    const R = {};
    const [cw, ch] = g.card;
    el.classList.toggle('roomy', roomy);
    el.classList.toggle('face-scan', cfg.face === 'scan');
    el.style.setProperty('--card-w', cw + 'px');
    el.style.setProperty('--rh', g.railHead + 'px');
    if (opt.density === 'compact') el.style.cssText += ';--badge-power-size:14px;--badge-num-size:13px;--badge-h:20px;--badge-inset:2px;';
    const o = cfg.opp, m = cfg.me;
    let h = '';
    if (!opt.boardOnly) h += `<a class="skiplink" href="#decision" data-skip="decision">${cfg.skipLabel || 'Skip to decision'} <kbd>P</kbd></a>`;
    h += `<div class="mat" style="${px(g.mat)}"></div>`;
    // Whose turn, without reading (UX-R12): a 4 px bar along the acting player's half of the mat
    const oppTurn = cfg.mid && cfg.mid.opp;
    if (cfg.turnBar !== false && cfg.mid) h += `<div class="turnbar ${oppTurn ? 'opp' : 'me'}" aria-hidden="true" style="left:0;top:${oppTurn ? 0 : g.mid[1] + g.mid[3] / 2}px;height:${oppTurn ? g.mid[1] + g.mid[3] / 2 : g.H - g.mid[1] - g.mid[3] / 2}px"></div>`;
    h += `<div role="application" aria-roledescription="game board" aria-label="${esc(cfg.boardLabel || 'Game board')}" class="board-app">`;

    // Opponent strip
    h += `<div role="group" data-zone="opp-top" aria-label="Opponent: identity and hand">`;
    h += `<div class="z oppid zitem" style="${px(g.oppId)}" role="group" aria-label="Opponent: ${esc((o.idText || 'Kaido · Pirate AI').replace(/<[^>]+>/g, ''))}${o.status ? ', ' + esc(o.status) : ''}"><span class="chip opp">Opp</span><span class="nmx">${o.idText || 'Kaido · Pirate AI'}</span>${o.status ? `<span class="chip outline" style="color:var(--color-opponent-text);border-color:var(--color-opponent)">${o.status}</span>` : ''}</div>`;
    const ohn = o.hand ?? 5; const known = o.known || [];
    let oh = `<div class="z opphand zitem" style="${px(g.oppHand)}" role="group" aria-label="Opponent's hand, ${ohn} cards${known.length ? '; known: ' + known.join(', ') : ''}">`;
    const bw = Math.round(cw * 0.4), bhh = Math.round(ch * 0.4), ox = g.oppHand[2] / 2 - (ohn * (bw + 4)) / 2;
    for (let i = 0; i < ohn; i++) oh += `<span class="back peek" style="left:${ox + i * (bw + 4)}px;width:${bw}px;height:${bhh}px;top:${g.oppHand[3] - bhh - 4}px" aria-hidden="true"></span>`;
    oh += `<span class="cnt">${ohn} card${ohn === 1 ? '' : 's'}${known.length ? `&nbsp;<span class="chip outline" style="margin-left:4px" title="Known: ${known.join(', ')}">${known.length} known</span>` : ''}</span></div>`;
    h += oh + '</div>';

    const side = (p, pre, mine) => {
      const L = mine ? 'Your' : 'Opponent’s';
      const given = (p.leader && p.leader.don ? p.leader.don : 0) + (p.chars || []).reduce((a, c) => a + (c && c.don ? c.don : 0), 0);
      let s = `<div role="group" data-zone="${mine ? 'my' : 'opp'}-row" aria-label="${L} Leader row: DON!!, Life, Leader, Stage, Deck, Trash">`;
      s += donDeck(`${L} DON!! deck`, p.donDeck ?? 0, g[pre + 'DonDeck'], g);
      s += costArea(mine ? 'me' : 'opp', g[pre + 'Cost'], g, { ...p, given: p.given ?? given });
      s += lifeZone(`${L} Life`, p.life === undefined ? 5 : p.life, g[pre + 'Life'], g, mine);
      R[(mine ? 'me' : 'opp') + '.life'] = g[pre + 'Life'];
      s += slotHTML(p.leader, g[pre + 'Leader'], g, `${L} Leader`);
      R[(mine ? 'me' : 'opp') + '.leader'] = g[pre + 'Leader'];
      s += slotHTML(p.stage, g[pre + 'Stage'], g, `${L} Stage`, 'Stage');
      R[(mine ? 'me' : 'opp') + '.stage'] = g[pre + 'Stage'];
      R[(mine ? 'me' : 'opp') + '.cost'] = g[pre + 'Cost'];
      R[(mine ? 'me' : 'opp') + '.deck'] = g[pre + 'Deck'];
      R[(mine ? 'me' : 'opp') + '.trash'] = g[pre + 'Trash'];
      s += deckZone(`${L} deck`, p.deck ?? 40, g[pre + 'Deck'], g, (p.deck ?? 40) <= 5);
      s += trashZone(`${L} trash`, p.trash || { n: 0 }, g[pre + 'Trash'], g);
      s += '</div>';
      const cy = mine ? g.myCharY : g.oppCharY;
      const chars = p.chars || [];
      const allEmpty = chars.every((c) => !c);
      let cs = `<div role="group" data-zone="${mine ? 'my' : 'opp'}-chars" aria-label="${L} Characters">`;
      for (let i = 0; i < 5; i++) {
        const r = [g.charX[i], cy, g.slot, g.slot];
        R[(mine ? 'me' : 'opp') + '.c' + (i + 1)] = r;
        cs += slotHTML(chars[i], r, g, `${L} Character slot ${i + 1}`, allEmpty && i === 2 ? 'Character area' : '');
      }
      cs += '</div>';
      return { row: s, chars: cs };
    };
    const os = side(o, 'opp', false), ms = side(m, 'my', true);
    // DOM order = tab order (accessibility §3.1, C3)
    h += os.row + os.chars;
    h += `<div role="group" data-zone="mid" aria-label="Turn and phase">${midline(cfg.mid || {}, g)}</div>`;
    h += ms.chars + ms.row;

    // Hand
    const hand = m.hand || [];
    const hr = g.myHand;
    const n = hand.length;
    let pitch = cw + g.handGap;
    if (n > g.handMax) pitch = (hr[2] - cw) / (n - 1);
    const total = n ? cw + (n - 1) * pitch : 0;
    const startX = g.axis - total / 2;
    let hh = `<div class="z" role="group" data-zone="hand" aria-label="Your hand, ${n} cards" style="left:0;top:0;width:0;height:0">`;
    hand.forEach((c, i) => {
      const r = [startX + i * pitch, hr[1], cw, ch];
      R['me.hand.' + (i + 1)] = r;
      hh += `<div class="zitem">${cardHTML({ ...c, inHand: true }, r, g)}</div>`;
    });
    h += hh + '</div>';
    if (cfg.boardExtra) h += cfg.boardExtra(g, R);
    h += '</div>'; // application

    h += arrowSVG(cfg.arrows, R, g.mat[2], g.mat[3]);

    let mode = 'collapsed';
    if (!opt.boardOnly) {
      mode = cfg.decisionTall ? 'dtall' : (cfg.coach || 'collapsed');
      const M = g.modes[mode];
      h += `<div class="rail" style="${px(g.rail)}">`;
      if (cfg.railHtml) {
        // Custom rail body (review Study mode): rail header and notice stay; the body fills the rest.
        h += cfg.railHtml(g, g.notice[0] + g.notice[1]);
        h += railHead(g, cfg);
      } else {
        // DOM order = tab order: decision panel, coach, log, rail header (accessibility §3.1, C3)
        h += decisionHTML(cfg.decision || { title: '' }, M.dec[0], M.dec[1], M.parts, mode);
        h += coachHTML(cfg, M.coach[0], M.coach[1], mode);
        const ticker = mode === 'tall' || mode === 'dtall';
        h += logHTML(ticker ? (cfg.log || []).filter((l) => !l.includes('class="th"')).slice(-3) : cfg.log, M.log[0], M.log[1], ticker);
        h += railHead(g, cfg);
      }
      h += '</div>';
      if (cfg.extra) h += cfg.extra(g, R);
    }
    el.innerHTML = h;
    el.dataset.mode = mode;
    el.style.width = (opt.boardOnly ? g.mat[2] : g.W) + 'px';
    el.style.height = g.H + 'px';
    if (!opt.boardOnly) initZones(el);
    return { g, R };
  }

  /* ---------- Keyboard model (accessibility.md §3) ---------- */
  const ZONES = ['opp-top', 'opp-row', 'opp-chars', 'mid', 'my-chars', 'my-row', 'hand'];
  const remembered = {};
  function zoneItems(z) {
    return [...z.querySelectorAll('.zitem')].map((it) => it.querySelector('button.card, .rowbtn') || it);
  }
  function initZones(el) {
    ZONES.forEach((name) => {
      const z = el.querySelector(`[data-zone="${name}"]`);
      if (!z) return;
      const items = zoneItems(z);
      // any other focusable inside the zone leaves the tab sequence; arrows reach it
      z.querySelectorAll('button, a[href]').forEach((b) => b.setAttribute('tabindex', '-1'));
      items.forEach((it) => { it.setAttribute('tabindex', '-1'); it.dataset.zi = name; });
      const pick = items[remembered[name] || 0] || items[0];
      if (pick) pick.setAttribute('tabindex', '0');
    });
    // The log is one stop too: arrows move through its links
    const log = el.querySelector('.log [role="log"]');
    if (log) {
      const links = [...log.querySelectorAll('a, button')];
      links.forEach((a, i) => { a.setAttribute('tabindex', i === links.length - 1 ? '0' : '-1'); a.dataset.zi = 'log'; });
      if (!links.length) log.setAttribute('tabindex', '0');
    }
    // Scroll containers are focusable only when they actually scroll
    el.querySelectorAll('.dbody, .coachbody, .rbody').forEach((b) => { if (b.scrollHeight > b.clientHeight + 1) b.setAttribute('tabindex', '0'); });
  }
  function itemsOf(el, name) {
    if (name === 'log') return [...el.querySelectorAll('.log [role="log"] a, .log [role="log"] button')];
    const z = el.querySelector(`[data-zone="${name}"]`);
    return z ? zoneItems(z) : [];
  }
  function focusItem(el, name, idx) {
    const items = itemsOf(el, name);
    if (!items.length) return;
    const i = Math.max(0, Math.min(items.length - 1, idx));
    items.forEach((it) => it.setAttribute('tabindex', '-1'));
    items[i].setAttribute('tabindex', '0');
    remembered[name] = i;
    items[i].focus();
  }
  function announce(t) {
    let lr = document.getElementById('announce-polite');
    if (!lr) { lr = document.createElement('div'); lr.id = 'announce-polite'; lr.className = 'sr-only'; lr.setAttribute('role', 'status'); lr.setAttribute('aria-live', 'polite'); document.body.appendChild(lr); }
    lr.textContent = ''; setTimeout(() => { lr.textContent = t; }, 30);
  }
  function toast(el, html, near) {
    el.querySelectorAll('.toast.kbd-toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast kbd-toast'; t.setAttribute('aria-hidden', 'true');
    const r = near ? near.getBoundingClientRect() : null; const s = el.getBoundingClientRect();
    t.style.left = (r ? Math.min(r.left - s.left, s.width - 360) : 24) + 'px';
    t.style.top = (r ? Math.max(8, r.top - s.top - 44) : 8) + 'px';
    t.innerHTML = html; el.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }
  function focusDecision(el) {
    const d = el.querySelector('#decision');
    if (!d) { const r = el.querySelector('.rbody'); if (r) { if (!r.hasAttribute('tabindex')) r.setAttribute('tabindex', '-1'); r.focus(); } return; }
    const f = d.querySelector('.dbody button:not([aria-disabled="true"]), .dbody a[href], .dbody input, .dfoot [data-key], .dfoot button:not([aria-disabled="true"]), .dfoot a[href]');
    (f || d).focus();
  }
  const GOTO = { h: ['hand', 0], c: ['my-chars', 0], l: ['my-row', 3], s: ['my-row', 4], d: ['my-row', 1], n: ['my-row', 0], k: ['my-row', 5], t: ['my-row', 6], f: ['my-row', 2],
    H: ['opp-top', 1], C: ['opp-chars', 0], L: ['opp-row', 3], S: ['opp-row', 4], D: ['opp-row', 1], N: ['opp-row', 0], K: ['opp-row', 5], T: ['opp-row', 6], F: ['opp-row', 2] };
  function installKeys(el) {
    if (el.dataset.keys) return; el.dataset.keys = '1';
    let pending = null; // 'G' or a popover element
    const closePop = () => { el.querySelectorAll('.kbd-pop').forEach((p) => p.remove()); pending = null; };
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-skip]');
      if (a) { e.preventDefault(); focusDecision(el); }
    });
    el.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
      const inBoard = !!t.closest('.board-app') || t === document.body;
      // Two-key "Go to" (no timeout, WCAG 2.2.1)
      if (pending === 'G') {
        e.preventDefault();
        if (e.key === 'Escape') { closePop(); return; }
        const k = e.key;
        closePop();
        if (k === 'b' || k === 'p') { focusDecision(el); return; }
        if (k === 'g') { const l = itemsOf(el, 'log'); if (l.length) l[l.length - 1].focus(); return; }
        const tgt = GOTO[k]; if (tgt) focusItem(el, tgt[0], tgt[1]);
        return;
      }
      if (pending && pending.nodeType) {
        if (e.key === 'Escape') { e.preventDefault(); const back = pending._back; closePop(); if (back) back.focus(); }
        return;
      }
      // Arrow keys inside a zone (roving tabindex)
      const zn = t.dataset && t.dataset.zi;
      if (zn && ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const items = itemsOf(el, zn); const i = items.indexOf(t);
        if (e.key === 'ArrowLeft') focusItem(el, zn, i - 1);
        if (e.key === 'ArrowRight') focusItem(el, zn, i + 1);
        if (e.key === 'Home') focusItem(el, zn, 0);
        if (e.key === 'End') focusItem(el, zn, items.length - 1);
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && zn !== 'log') {
          if (zn === 'log') return;
          const zi = ZONES.indexOf(zn) + (e.key === 'ArrowUp' ? -1 : 1);
          const nz = ZONES[zi]; if (!nz) return;
          const cx = t.getBoundingClientRect().left + t.getBoundingClientRect().width / 2;
          const ni = itemsOf(el, nz); if (!ni.length) return;
          let best = 0, bd = 1e9; ni.forEach((it, j) => { const r = it.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - cx); if (d < bd) { bd = d; best = j; } });
          focusItem(el, nz, best);
        }
        return;
      }
      const isText = e.key.length === 1;
      if (!isText && e.key !== 'Enter' && e.key !== 'Escape') return;
      if (e.key === 'Escape') { closePop(); return; }
      // Dedicated key of a visible button (primary button, Rewind, Skip): shown on the button itself
      const keyBtn = (k) => el.querySelector(`#decision [data-key="${k}"]:not([aria-disabled="true"])`);
      if (e.key === 'Enter') {
        if (t.matches('button, a[href], input, [role="menuitem"]')) return; // native activation of the focused control
        const b = keyBtn('Enter'); if (b) { e.preventDefault(); b.click(); }
        return;
      }
      if (!inBoard && !t.closest('#decision, .rail')) return;
      const k = e.key;
      if (k === 'p' || k === 'P') { e.preventDefault(); focusDecision(el); announce('Current decision'); return; }
      if (k === 'g' || k === 'G') {
        e.preventDefault(); pending = 'G';
        const pop = document.createElement('div');
        pop.className = 'pop noarrow kbd-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Go to zone');
        pop.style.cssText = 'left:24px;top:50%;transform:translateY(-50%);width:300px';
        pop.innerHTML = `<div class="ph">Go to… <span class="subtle" style="font-weight:500">Shift = opponent's · Esc closes</span></div>
          <div class="gogrid">${[['h', 'Hand'], ['c', 'Characters'], ['l', 'Leader'], ['s', 'Stage'], ['d', 'DON!! cost area'], ['n', 'DON!! deck'], ['k', 'Deck'], ['t', 'Trash'], ['f', 'Life'], ['p', 'Decision'], ['g', 'Game log']].map(([a, b]) => `<span><kbd>${a}</kbd> ${b}</span>`).join('')}</div>`;
        el.appendChild(pop); announce('Go to: press a zone letter. Shift for the opponent.');
        return;
      }
      if (!inBoard) return;
      if (k === 'e' || k === 'E') { const b = keyBtn('E'); if (b) { e.preventDefault(); b.click(); } return; }
      if (k === 'u' || k === 'U') {
        const b = keyBtn('U'); e.preventDefault();
        if (!b) { announce('Rewind is not available in this mode'); return; }
        toast(el, `⟲ Rewound one move <span class="subtle">· wireframe: no state change</span>`, b); announce('Rewound one move. Your Main phase.');
        return;
      }
      if (k === 's' || k === 'S') { const b = keyBtn('S'); if (b) { e.preventDefault(); b.click(); } return; }
      const card = t.closest('button.card');
      if (k === 'a' || k === 'A') {
        e.preventDefault();
        if (!card) { announce('Focus a Leader or Character first'); return; }
        if (card.dataset.g === 'attack') { location.href = '04-attack.html#target'; return; }
        const why = `${card.dataset.name} can’t attack${card.dataset.mine ? '' : ': it is the opponent’s card'}${card.closest('[data-zone="hand"]') ? ': it is in your hand' : (card.classList.contains('rested') ? ': it is rested' : '')}.`;
        toast(el, `<span aria-hidden="true">⊘</span> ${why}`, card); announce(why);
        return;
      }
      if (k === '+' || k === '=') {
        e.preventDefault();
        const act = el.querySelector('[data-zone="my-row"] .costarea');
        const active = act ? Number((act.getAttribute('aria-label').match(/(\d+) active/) || [0, 0])[1]) : 0;
        const ok = card && card.dataset.mine && !card.closest('[data-zone="hand"]') && card.closest('[data-zone="my-row"], [data-zone="my-chars"]') && !card.getAttribute('aria-label').includes('trash');
        if (!ok) { const why = 'Give DON!!: focus your Leader or a Character first.'; toast(el, why, card || t); announce(why); return; }
        if (!active) { const why = 'No active DON!! left to give.'; toast(el, why, card); announce(why); return; }
        const r = card.getBoundingClientRect(), s = el.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'pop left kbd-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', `Give DON!! to ${card.dataset.name}`);
        pop.style.cssText = `left:${r.right - s.left + 12}px;top:${r.top - s.top}px;width:240px`;
        let n = 1;
        const draw = () => { pop.innerHTML = `<div class="ph">Give DON!! to ${card.dataset.name}</div><div class="row" style="gap:6px"><button class="btn small" type="button" data-d="-1" aria-label="One fewer">−</button><span class="num" role="status" style="min-width:56px;text-align:center"><b>${n}</b> of ${active}</span><button class="btn small" type="button" data-d="1" aria-label="One more">+</button><button class="btn small primary" type="button" data-give>Give <kbd>↵</kbd></button></div><p class="subtle" style="margin:6px 0 0;font-size:12px">+${n * 1000} power, this turn only · Esc cancels</p>`; };
        draw(); pop._back = card; el.appendChild(pop); pending = pop;
        pop.addEventListener('click', (ev) => {
          const d = ev.target.closest('[data-d]'); if (d) { n = Math.max(1, Math.min(active, n + Number(d.dataset.d))); draw(); pop.querySelector('[data-give]').focus(); return; }
          if (ev.target.closest('[data-give]')) { closePop(); card.focus(); toast(el, `◆ Gave ${n} DON!! to ${card.dataset.name} <span class="subtle">· wireframe: no state change</span>`, card); announce(`Gave ${n} DON!! to ${card.dataset.name}.`); }
        });
        pop.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowUp' || ev.key === '+' || ev.key === '=') { ev.preventDefault(); n = Math.min(active, n + 1); draw(); pop.querySelector('[data-give]').focus(); } if (ev.key === 'ArrowDown' || ev.key === '-') { ev.preventDefault(); n = Math.max(1, n - 1); draw(); pop.querySelector('[data-give]').focus(); } });
        pop.querySelector('[data-give]').focus();
        announce(`Give DON!! to ${card.dataset.name}. 1 of ${active}. Up and Down change the count, Enter gives.`);
        return;
      }
    });
  }

  /* ---------- Page helpers ---------- */
  function state() { return (location.hash || '').replace('#', '') || null; }
  function statesBar(list, label) {
    const cur = state() || list[0][0];
    const bar = document.createElement('nav');
    bar.className = 'wf-states';
    bar.setAttribute('aria-label', 'Wireframe states (not product UI)');
    bar.innerHTML = `<span style="color:#f2c94c">${label || 'Wireframe states'}</span>` + list.map(([k, t]) => `<a href="#${k}" ${k === cur ? 'aria-current="true"' : ''}>${t}</a>`).join('') + '<a href="index.html">Index</a>';
    document.body.appendChild(bar);
    document.addEventListener('keydown', (e) => { if (e.key === '`') bar.classList.toggle('show'); });
    if (new URLSearchParams(location.search).has('states')) bar.classList.add('show');
    window.addEventListener('hashchange', () => { bar.querySelectorAll('a').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + (state() || list[0][0]) ? 'true' : 'false')); });
  }
  function mountBoard(fn, states) {
    const stage = document.querySelector('.stage');
    const draw = () => {
      const st = state() || (states && states[0][0]);
      const cfg = fn(st);
      renderBoard(stage, cfg);
      if (cfg.after) cfg.after(stage);
      document.title = (cfg.pageTitle || document.title.split(' · ')[0]) + (st && states ? ' · ' + st : '');
    };
    draw();
    installKeys(stage);
    window.addEventListener('hashchange', draw);
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 100); });
    if (states) statesBar(states);
  }

  // Shared footer and header for non-board pages
  function chrome(current) {
    const nav = [['01-welcome.html', 'Home'], ['02-setup.html', 'Play'], ['18-learn.html', 'Learn'], ['14-drill-lethal.html', 'Drills'], ['19-progress.html', 'Progress'], ['12-deck-builder.html', 'Decks'], ['13-meta.html', 'Meta'], ['20-history.html', 'Reviews']];
    const header = document.querySelector('header.app-header');
    if (header) header.innerHTML = `<a class="wordmark" href="01-welcome.html"><span class="mark" aria-hidden="true"></span>OPTCG Sim</a>
      <nav class="app-nav" aria-label="Main">${nav.map(([h, t]) => `<a href="${h}" ${t === current ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <span class="spacer"></span>
      <a class="btn ghost small" href="16-settings.html#rules">Help <kbd>?</kbd></a>
      <a class="btn ghost small" href="16-settings.html" ${current === 'Settings' ? 'aria-current="page"' : ''}>Settings</a>
      <a class="btn ghost small" href="index.html" title="Wireframe index (not product UI)">Index</a>`;
    const footer = document.querySelector('footer.app-footer');
    if (footer) footer.innerHTML = `<span>${DISCLAIMER}</span><span class="spacer"></span><a href="16-settings.html#about">About and sources</a>`;
  }

  window.WF = { G, cardHTML, renderBoard, mountBoard, statesBar, state, chrome, esc, isRoomy, DISCLAIMER, DISCLAIMER_SHORT, installKeys, announce };
})();
