/**
 * A passive listener on NVDA's speech. Guidepup's own log keeps only the speech that follows each
 * action it performs, and it stops speech before every action; announcements that arrive later
 * (an AI move, a live region written after a delay) would be lost. This joins the same NVDA Remote
 * relay channel that Guidepup uses ("guidepup", on 127.0.0.1:6837) as a second client and records
 * every `speak` message with a timestamp. If the relay refuses a second client, the run continues
 * with Guidepup's log alone and the record says so.
 */
import { connect, type TLSSocket } from 'node:tls';

export interface Heard {
  t: number;
  text: string;
}

export class SpeechTap {
  heard: Heard[] = [];
  error: string | null = null;
  private socket: TLSSocket | null = null;
  private buf = '';

  async start(timeoutMs = 10_000): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.error = 'timed out joining the NVDA Remote relay';
        resolve(false);
      }, timeoutMs);
      const s = connect({ host: '127.0.0.1', port: 6837, rejectUnauthorized: false }, () => {
        s.write(
          JSON.stringify({ type: 'join', connection_type: 'master', channel: 'guidepup' }) + '\n',
        );
        s.write(JSON.stringify({ type: 'protocol_version', version: 2 }) + '\n');
      });
      this.socket = s;
      s.setEncoding('utf8');
      s.on('error', (e) => {
        this.error = String(e);
        clearTimeout(timer);
        resolve(false);
      });
      s.on('data', (chunk: string) => {
        this.buf += chunk;
        let i: number;
        while ((i = this.buf.indexOf('\n')) >= 0) {
          const line = this.buf.slice(0, i).trim();
          this.buf = this.buf.slice(i + 1);
          if (!line) continue;
          let m: { type?: string; sequence?: unknown[] };
          try {
            m = JSON.parse(line);
          } catch {
            continue;
          }
          if (m.type === 'channel_joined') {
            clearTimeout(timer);
            resolve(true);
          } else if (m.type === 'speak' && Array.isArray(m.sequence)) {
            const text = m.sequence
              .filter((x): x is string => typeof x === 'string')
              .map((x) => x.trim().replace(/\s\s+/g, ' '))
              .filter(Boolean)
              .join(', ');
            if (text) this.heard.push({ t: Date.now(), text });
          }
        }
      });
    });
  }

  since(t: number): Heard[] {
    return this.heard.filter((h) => h.t >= t);
  }

  stop() {
    this.socket?.destroy();
    this.socket = null;
  }
}
