import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { renderMermaidToPng } from "../../utils/mermaid";

const handler = createMcpHandler(
  (server) => {
    // server.tool(
    //   "echo",
    //   "Echo a message",
    //   { message: z.string() },
    //   async ({ message }) => ({
    //     content: [{ type: "text", text: `Tool echo: ${message}` }],
    //   })
    // );

    server.tool(
      "render_mermaid",
      "Render Mermaid diagram code as PNG",
      { 
        mermaidCode: z.string().describe("The Mermaid diagram code to render")
      },
      async ({ mermaidCode }) => {
        try {
          const base64Png = await renderMermaidToPng(mermaidCode);
          
          return {
            content: [
              { 
                type: "image", 
                data: base64Png,
                mimeType: "image/png"
              }
            ],
          };
        } catch (error) {
          // In case of error, return the error as text
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: "text", text: `Error rendering Mermaid diagram: ${errorMessage}` }],
          };
        }
      }
    );
  },
  {
    capabilities: {
      tools: {
        // echo: {
        //   description: "Echo a message",
        // },
        render_mermaid: {
          description: "Render Mermaid diagram code as PNG",
        },
      },
    },
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
