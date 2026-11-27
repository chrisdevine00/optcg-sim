/**
 * M10 WP0: Lighthouse on the six routes of scripts/perf-routes.ts, with a fixed simulated throttle
 * (RTT 40 ms, 10 Mbps, CPU 4x slowdown), N cold runs per route, the median per metric and the
 * min and max.
 *
 *   npm run build && npm run perf:lighthouse -- [--runs 3] [--routes home,play] [--assert]
 *                                               [--release] [--mobile] [--out test-results]
 *
 * It builds nothing: it expects `app/dist`. It serves that with scripts/serve-dist.ts and drives
 * Playwright's Chromium (found through `chromium.executablePath()`, launched by chrome-launcher).
 * Writes `test-results/lighthouse.json` and `.md` whatever the verdict. Asserts only with
 * `--assert` (the perf workflow passes it): performance median >= 85 and accessibility median >= 90
 * per route, which is the 1.5-times-bound form of the requirement of 90 (docs/runbooks/testing.md
 * "Time and statistics"). `--release` is 5 runs asserted at the requirement, 90. `--mobile` records
 * Lighthouse's default mobile profile once per route for information and never asserts it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { PERF_ROUTES } from './perf-routes.ts';
import { BASE, serveDist } from './serve-dist.ts';

export const THROTTLE = { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 4 } as const;
export const REQUIREMENT = 90;
export const BOUND = { performance: 85, accessibility: 90 } as const;

export interface Run {
  performance: number;
  accessibility: number;
  bestPractices: number;
  lcp: number;
  fcp: number;
  tbt: number;
  cls: number;
  bytes: number;
}
export type Metric = keyof Run;
export const METRICS: Metric[] = [
  'performance',
  'accessibility',
  'bestPractices',
  'lcp',
  'fcp',
  'tbt',
  'cls',
  'bytes',
];

/** The median (the middle of the sorted values; the mean of the two middle ones for an even count). */
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length === 0 ? NaN : s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function summarise(runs: Run[]): { median: Run; min: Run; max: Run } {
  const pick = (f: (xs: number[]) => number) =>
    Object.fromEntries(METRICS.map((k) => [k, f(runs.map((r) => r[k]))])) as unknown as Run;
  return {
    median: pick(median),
    min: pick((x) => Math.min(...x)),
    max: pick((x) => Math.max(...x)),
  };
}

interface Args {
  runs: number;
  routes: string[] | null;
  assert: boolean;
  release: boolean;
  mobile: boolean;
  out: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    runs: 3,
    routes: null,
    assert: false,
    release: false,
    mobile: false,
    out: 'test-results',
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    if (k === '--runs') a.runs = Number(argv[++i]);
    else if (k === '--routes') a.routes = argv[++i]!.split(',');
    else if (k === '--out') a.out = argv[++i]!;
    else if (k === '--assert') a.assert = true;
    else if (k === '--release') {
      a.release = true;
      a.assert = true;
      a.runs = Math.max(a.runs, 5);
    } else if (k === '--mobile') a.mobile = true;
    else if (k !== '--') throw new Error(`Unknown argument ${k}`);
  }
  if (!Number.isInteger(a.runs) || a.runs < 1) throw new Error('--runs needs a positive integer');
  return a;
}

type Lhr = {
  lighthouseVersion: string;
  environment: { hostUserAgent: string };
  categories: Record<string, { score: number | null }>;
  audits: Record<string, { numericValue?: number }>;
};

function toRun(lhr: Lhr): Run {
  const score = (id: string) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
  const num = (id: string) => lhr.audits[id]?.numericValue ?? NaN;
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    lcp: Math.round(num('largest-contentful-paint')),
    fcp: Math.round(num('first-contentful-paint')),
    tbt: Math.round(num('total-blocking-time')),
    cls: Math.round(num('cumulative-layout-shift') * 1000) / 1000,
    bytes: Math.round(num('total-byte-weight')),
  };
}

const fmt = (r: Run) =>
  `${r.performance} | ${r.accessibility} | ${r.bestPractices} | ${r.lcp} | ${r.fcp} | ${r.tbt} | ${r.cls} | ${(r.bytes / 1024).toFixed(0)}`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const routes = PERF_ROUTES.filter((r) => !args.routes || args.routes.includes(r.name));
  if (routes.length === 0) throw new Error('No route matches --routes');
  const { server, port } = await serveDist({ spa: true });
  const chromePath = chromium.executablePath();
  const chrome = await launch({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run'],
  });
  let chromeVersion = '';
  const out: {
    lighthouse: string;
    throttle: typeof THROTTLE & { formFactor: string; screen: string };
    chrome: string;
    runsPerRoute: number;
    routes: { name: string; path: string; runs: Run[]; median: Run; min: Run; max: Run }[];
    mobile?: { name: string; run: Run }[];
  } = {
    lighthouse: '',
    throttle: { ...THROTTLE, formFactor: 'desktop', screen: '1350x940' },
    chrome: '',
    runsPerRoute: args.runs,
    routes: [],
  };
  try {
    const audit = async (path: string, desktop: boolean): Promise<Lhr> => {
      const url = `http://127.0.0.1:${port}${BASE}${path}`;
      const flags = {
        port: chrome.port,
        logLevel: 'error' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        ...(desktop
          ? {
              formFactor: 'desktop' as const,
              screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
              },
              throttlingMethod: 'simulate' as const,
              throttling: {
                ...THROTTLE,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }
          : {}),
      };
      const res = await lighthouse(url, flags);
      if (!res) throw new Error(`Lighthouse returned nothing for ${url}`);
      const lhr = res.lhr as unknown as Lhr & { runtimeError?: { code: string; message: string } };
      if (lhr.runtimeError)
        throw new Error(`${url}: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
      out.lighthouse = lhr.lighthouseVersion;
      chromeVersion = lhr.environment.hostUserAgent;
      return lhr;
    };
    for (const route of routes) {
      const runs: Run[] = [];
      for (let i = 0; i < args.runs; i++) {
        runs.push(toRun(await audit(route.path, true)));
        console.log(`${route.name} run ${i + 1}/${args.runs}: ${fmt(runs[i]!)}`);
      }
      out.routes.push({ name: route.name, path: route.path, runs, ...summarise(runs) });
    }
    if (args.mobile) {
      out.mobile = [];
      for (const route of routes) {
        out.mobile.push({ name: route.name, run: toRun(await audit(route.path, false)) });
      }
    }
  } finally {
    await chrome.kill();
    server.close();
  }
  out.chrome = chromeVersion;

  mkdirSync(args.out, { recursive: true });
  writeFileSync(join(args.out, 'lighthouse.json'), JSON.stringify(out, null, 2) + '\n');
  const md = [
    `Lighthouse ${out.lighthouse}, ${out.chrome}; desktop 1350x940, simulated throttle RTT ${THROTTLE.rttMs} ms, ${THROTTLE.throughputKbps / 1024} Mbps, CPU ${THROTTLE.cpuSlowdownMultiplier}x; ${args.runs} cold run(s) per route, median (min to max of performance).`,
    '',
    '| Route | Performance | Accessibility | Best practices | LCP ms | FCP ms | TBT ms | CLS | Transfer KB |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...out.routes.map(
      (r) =>
        `| ${r.name} | ${r.median.performance} (${r.min.performance} to ${r.max.performance}) | ${r.median.accessibility} | ${r.median.bestPractices} | ${r.median.lcp} | ${r.median.fcp} | ${r.median.tbt} | ${r.median.cls} | ${(r.median.bytes / 1024).toFixed(0)} |`,
    ),
  ];
  if (out.mobile)
    md.push(
      '',
      'Lighthouse default mobile profile, one run per route, for information only (never asserted):',
      '',
      '| Route | Performance | Accessibility | Best practices | LCP ms | FCP ms | TBT ms | CLS | Transfer KB |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...out.mobile.map((m) => `| ${m.name} | ${fmt(m.run)} |`),
    );
  writeFileSync(join(args.out, 'lighthouse.md'), md.join('\n') + '\n');
  console.log('\n' + md.join('\n'));

  if (!args.assert) return;
  const bar = args.release ? { performance: REQUIREMENT, accessibility: REQUIREMENT } : BOUND;
  let failed = 0;
  for (const r of out.routes)
    for (const cat of ['performance', 'accessibility'] as const) {
      const ok = r.median[cat] >= bar[cat];
      console.log(
        `${ok ? 'ok  ' : 'FAIL'} ${r.name} ${cat}: requirement ${REQUIREMENT}, observed ${r.median[cat]}, bound ${bar[cat]}`,
      );
      if (!ok) failed++;
    }
  if (failed) {
    console.error(`${failed} Lighthouse bound(s) missed.`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
