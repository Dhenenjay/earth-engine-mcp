# Example Next.js MCP Server

**Uses `@vercel/mcp-adapter`**


## Usage

This sample app uses the [Vercel MCP Adapter](https://www.npmjs.com/package/@vercel/mcp-adapter) that allows you to drop in an MCP server on a group of routes in any Next.js project.

Update `app/[transport]/route.ts` with your tools, prompts, and resources following the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk/tree/main?tab=readme-ov-file#server).

## Included Tools

### Echo Tool

A simple tool that echoes back a message.

### Mermaid Diagram Renderer

A tool that renders [Mermaid](https://mermaid.js.org/) code as PNG images. It accepts Mermaid diagram code and returns the rendered diagram as a PNG image.

#### Implementation

The Mermaid renderer uses `@mermaid-js/mermaid-cli` to generate high-quality diagrams from Mermaid code. The implementation:

1. Creates a temporary Mermaid file from the provided code
2. Uses mermaid-cli with Puppeteer to render it to a PNG image
3. Returns the image as a base64-encoded string
4. Includes extensive error handling and automatic browser detection

For serverless environments like Vercel, the system:
- Installs Chrome headless shell during build
- Configures Puppeteer to use the installed Chrome
- Includes fallback mechanisms for compatibility

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

### Mermaid Rendering Setup

For the Mermaid diagram rendering to work correctly on Vercel:

1. The `vercel-build.js` script will run during deployment to:
   - Install Chrome headless shell for Puppeteer
   - Set up proper permissions and configuration
   - Create the necessary puppeteer-config.json file
   - Test that everything works

2. The `vercel.json` file includes required environment variables:
   - `PUPPETEER_CACHE_DIR: "/tmp"` - Configures where Puppeteer looks for browsers
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"` - Prevents duplicate Chrome downloads
   - `NODE_OPTIONS: "--max-old-space-size=4096"` - Increases memory limit for rendering

3. Local development:
   - Run `npx puppeteer browsers install chrome-headless-shell` to install the required browser
   - The code automatically detects Chrome's location in both local and serverless environments

## Sample Client

`script/test-client.mjs` contains a sample client to try invocations.

```sh
node scripts/test-client.mjs https://mcp-for-next-js.vercel.app
```

For testing the Mermaid rendering specifically:

```sh
node scripts/test-mermaid.mjs http://localhost:3000
```
