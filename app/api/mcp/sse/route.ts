import { NextRequest } from 'next/server';
import { buildServer } from '@/src/mcp/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const server = await buildServer();
  return server.sse();
}
