import { existsSync, unlinkSync } from 'fs';
import { appendFile } from 'fs/promises';

let logQueue = Promise.resolve();
if (existsSync('./debug.md')) {
  unlinkSync('./debug.md');
}
export function debug(...args: any[]) {
  logQueue = logQueue.then(() =>
    appendFile('./debug.md', args.map((arg) => String(arg)).join(' ') + '\n')
  );
}
