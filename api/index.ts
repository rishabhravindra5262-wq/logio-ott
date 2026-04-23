import createServer from '../server.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let appPromise: Promise<any>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!appPromise) {
    appPromise = createServer();
  }
  const app = await appPromise;
  return app(req, res);
}
