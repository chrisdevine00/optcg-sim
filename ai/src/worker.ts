/// <reference lib="webworker" />
import { AI_TIERS } from './index.ts';

self.onmessage = (e: MessageEvent<{ type: 'ping' }>) => {
  if (e.data.type === 'ping') self.postMessage({ type: 'pong', tiers: AI_TIERS });
};
