# Example Next.js MCP Server

**Uses `@vercel/mcp-adapter`**


## Usage

This sample app uses the [Vercel MCP Adapter](https://www.npmjs.com/package/@vercel/mcp-adapter) that allows you to drop in an MCP server on a group of routes in any Next.js project.

Update `app/[transport]/route.ts` with your tools, prompts, and resources following the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk/tree/main?tab=readme-ov-file#server).

## Included Tools

### Echo Tool

A simple tool that echoes back a message.

### Mermaid Diagram Renderer

A tool that renders [Mermaid](https://mermaid.js.org/) code as diagrams. It accepts Mermaid diagram code and returns the rendered diagram as an image.

#### Implementation

The Mermaid renderer uses a multi-stage approach for maximum compatibility:

1. First, it attempts to use `@mermaid-js/mermaid-cli` to generate high-quality PNGs
2. If that fails (e.g., in serverless environments), it falls back to client-side rendering using JSDOM and returns SVG
3. All formats are handled transparently in the route handler

This hybrid approach ensures:

- Works in local development with full Puppeteer and Chrome
- Works in serverless Vercel deployments without browser dependencies
- Provides graceful degradation with detailed error handling
- Requires minimal setup for either environment

#### Example Usage:

```javascript
const result = await client.useTool("render_mermaid", {
  mermaidCode: `
    graph TD
      A[Start] --> B{Is it working?}
      B -->|Yes| C[Great!]
      B -->|No| D[Debug]
      D --> A
  `
});
```

## Notes for running on Vercel

- To use the SSE transport, requires a Redis attached to the project under `process.env.REDIS_URL`
- Make sure you have [Fluid compute](https://vercel.com/docs/functions/fluid-compute) enabled for efficient execution
- After enabling Fluid compute, open `app/route.ts` and adjust `maxDuration` to 800 if you using a Vercel Pro or Enterprise account
- [Deploy the Next.js MCP template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)

### Mermaid Rendering Setup for Vercel

For the Mermaid diagram rendering to work correctly on Vercel:

1. The `vercel-build.js` script is simplified to avoid browser installation, which doesn't work in Vercel's build environment
2. The rendering falls back to using JSDOM with client-side mermaid.js in serverless environments
3. No heavyweight browser installations are required, making deployment more reliable
4. The `vercel.json` file includes minimal environment variables needed for reliable serverless execution

## Sample Client

`script/test-client.mjs` contains a sample client to try invocations.

```sh
node scripts/test-client.mjs https://mcp-for-next-js.vercel.app
```

For testing the Mermaid rendering specifically:

```sh
node scripts/test-mermaid.mjs http://localhost:3000
```
