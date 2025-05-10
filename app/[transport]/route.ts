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
          
          // Improved detection of image format
          // PNG files start with iVBOR (base64 of PNG header)
          // SVG data usually contains "<svg" when decoded
          const isDataPng = base64Data.startsWith('iVBOR');
          
          // Decode the start of the base64 to check for SVG
          const decodedStart = Buffer.from(base64Data.slice(0, 30), 'base64').toString('utf-8');
          const isDataSvg = decodedStart.includes('<svg') || decodedStart.includes('<?xml');
          
          const mimeType = isDataPng ? "image/png" : 
                           isDataSvg ? "image/svg+xml" : 
                           "image/svg+xml"; // Default to SVG if unsure
          
          console.log(`Detected MIME type: ${mimeType}`);
          
          return {
            content: [
              { 
                type: "image", 
                data: base64Data,
                mimeType: mimeType
              }
            ],
          };
        } catch (error) {
          // In case of error, return the error as text
          console.error("Error in render_mermaid tool:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Generate a very simple plain text diagram
          const fallbackText = [
            "Failed to render diagram. Here's the code:",
            "----------------------------------------",
            mermaidCode,
            "----------------------------------------",
            `Error: ${errorMessage}`
          ].join('\n');
          
          return {
            content: [{ type: "text", text: fallbackText }],
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
