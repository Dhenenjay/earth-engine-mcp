import { createMcpServer } from '@vercel/mcp-adapter';
import { list, get, register, z } from './registry';
import { initEarthEngineWithSA } from '@/src/gee/client';

export async function buildServer(){
  await initEarthEngineWithSA();
  await import('./tools');
  const server = createMcpServer({
    tools: {
      listTools: async ()=> ({ tools: list() }),
      callTool: async (name: string, input: any)=> {
        const t = get(name);
        return await t.handler(input);
      },
    },
  });
  return server;
}

// Base health tool
register({
  name: 'health_check',
  description: 'Check server status',
  input: z.object({}).strict(),
  output: z.object({ status: z.string(), time: z.string() }),
  handler: async ()=> ({ status:'ok', time: new Date().toISOString() }),
});
