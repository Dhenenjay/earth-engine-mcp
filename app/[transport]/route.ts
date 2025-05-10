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
      "Render Mermaid diagram code as PNG or SVG",
      { 
        mermaidCode: z.string().describe("The Mermaid diagram code to render")
      },
      async ({ mermaidCode }) => {
        try {
          console.log("Starting Mermaid rendering process...");
          const base64Data = await renderMermaidToPng(mermaidCode);
          console.log("Rendering completed successfully!");
          
          // Determine if this is PNG or SVG data (function may return either)
          // Check first few bytes for PNG signature
          const isDataPng = base64Data.startsWith('iVBOR') || base64Data.startsWith('iVBOR');
          
          return {
            content: [
              { 
                type: "image", 
                data: base64Data,
                mimeType: isDataPng ? "image/png" : "image/svg+xml" 
              }
            ],
          };
        } catch (error) {
          // In case of error, return the error as text
          console.error("Error in render_mermaid tool:", error);
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
          description: "Render Mermaid diagram code as PNG or SVG",
        },
      },
    },
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: "",
    verboseLogs: true,
    maxDuration: 120,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
