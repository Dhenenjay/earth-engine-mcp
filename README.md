# Example Next.js MCP Server with Mermaid Diagram Rendering

**Uses `@vercel/mcp-adapter`**

## Usage

This sample app uses the [Vercel MCP Adapter](https://www.npmjs.com/package/@vercel/mcp-adapter) that allows you to drop in an MCP server on a group of routes in any Next.js project.

Update `app/[transport]/route.ts` with your tools, prompts, and resources following the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk/tree/main?tab=readme-ov-file#server).

## Included Tools

### Echo Tool

A simple tool that echoes back a message.

### Mermaid Diagram Renderer

A tool that renders [Mermaid](https://mermaid.js.org/) code as PNG images. It accepts Mermaid diagram code and returns the rendered diagram as a PNG image.

The implementation uses Puppeteer to render Mermaid diagrams directly in a headless browser, making it compatible with serverless environments like Vercel.

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

## Deployment Notes

### Vercel Deployment

This application is designed to be deployed on Vercel. To deploy:

1. Make sure your project has the following dependencies:
   - `react` and `react-dom` (required by Next.js)
   - `@vercel/mcp-adapter` and `@modelcontextprotocol/sdk` for MCP functionality
   - `puppeteer` for Mermaid rendering (version compatible with Vercel)

2. Additional requirements:
   - To use the SSE transport, requires a Redis attached to the project under `process.env.REDIS_URL`
   - Make sure you have [Fluid compute](https://vercel.com/docs/functions/fluid-compute) enabled for efficient execution
   - After enabling Fluid compute, open `app/[transport]/route.ts` and adjust `maxDuration` to 800 if you are using a Vercel Pro or Enterprise account

3. Deploy with:
   ```
   vercel deploy
   ```

## Local Development

For local development:

```sh
npm install
npm run dev
```

## Sample Clients

Testing the Mermaid rendering:

```sh
node scripts/test-mermaid.mjs http://localhost:3000
```

General MCP client testing:

```sh
node scripts/test-client.mjs http://localhost:3000
```
