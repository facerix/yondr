import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A small CDP connection using Chrome's debugging pipe; no browser-test dependency.
// Set CHROME_BIN on machines without Chrome at the standard macOS location.
export async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(), 'yondr-radio-tests-'));
  const executable = process.env.CHROME_BIN
    || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(executable, [
    '--headless', '--remote-debugging-pipe', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  let sequence = 0;
  let buffer = '';
  let stderr = '';
  let failure;
  chrome.stderr.on('data', chunk => { stderr += chunk; });
  const fail = error => {
    failure = error;
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  chrome.on('error', fail);
  const exited = new Promise(resolve => chrome.once('close', code => {
    fail(new Error(`Chrome exited (${code}): ${stderr}`));
    resolve();
  }));
  chrome.stdio[3].on('error', fail);
  chrome.stdio[4].on('data', chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\0')) !== -1) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  });

  async function send(method, params = {}, sessionId) {
    if (failure) throw failure;
    const id = ++sequence;
    let timeout;
    try {
      return await new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Chrome timed out: ${method}. ${stderr}`));
        }, 10000);
        pending.set(id, { resolve, reject });
        chrome.stdio[3].write(`${JSON.stringify({ id, method, params, sessionId })}\0`);
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async newPage() {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      return {
        send: (method, params) => send(method, params, sessionId),
        async evaluate(fn, ...args) {
          const result = await send('Runtime.evaluate', {
            expression: `(${fn})(...${JSON.stringify(args)})`,
            returnByValue: true, awaitPromise: true,
          }, sessionId);
          if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
          }
          return result.result.value;
        },
        close: () => send('Target.closeTarget', { targetId }),
      };
    },
    async close() {
      chrome.kill();
      await exited;
      await rm(profile, { recursive: true, force: true });
    },
  };
}
