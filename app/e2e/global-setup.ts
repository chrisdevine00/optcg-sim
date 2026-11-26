/**
 * Playwright globalSetup (M8 WP7): the planted games and the 300-decision fixture for the review specs
 * are built by `build-planted.ts` in a tsx child process, into `.cache/m8wp7/`.
 */
import { execFileSync } from 'node:child_process';

export default function globalSetup(): void {
  execFileSync('npx', ['tsx', 'app/e2e/build-planted.ts'], { stdio: 'inherit' });
}
