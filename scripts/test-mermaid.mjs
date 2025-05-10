import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import fs from 'fs';

const origin = process.argv[2] || "http://localhost:3000";

// Example Mermaid diagram code
const sampleMermaidCode = `
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
`;

async function main() {
  const transport = new SSEClientTransport(new URL(`${origin}/sse`));

  const client = new Client(
    {
      name: "mermaid-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    }
  );

  console.log("Connecting to", origin);
  await client.connect(transport);

  console.log("Connected", client.getServerCapabilities());

  // List available tools
  const toolsResponse = await client.listTools();
  console.log("Available tools:", toolsResponse);
  
  // Check if the tools array contains the render_mermaid tool
  const toolNames = toolsResponse.tools.map(tool => tool.name);
  if (toolNames.includes("render_mermaid")) {
    console.log("\nTesting Mermaid rendering tool...");
    console.log("Sample Mermaid code:", sampleMermaidCode);
    
    try {
      const result = await client.callTool({
        name: "render_mermaid", 
        arguments: {
          mermaidCode: sampleMermaidCode
        }
      });
      
      console.log("Tool response:", result);
      
      // If we got an image back, save it to a file
      if (result.content && result.content[0] && result.content[0].type === 'image') {
        const imageData = result.content[0].data;
        const mimeType = result.content[0].mimeType;
        
        // Determine the correct file extension based on MIME type
        let fileExtension = 'png';
        if (mimeType === 'image/svg+xml') {
          fileExtension = 'svg';
        }
        
        const outputFile = `mermaid-output.${fileExtension}`;
        fs.writeFileSync(outputFile, Buffer.from(imageData, 'base64'));
        console.log(`Image saved to ${outputFile}`);
      }
    } catch (error) {
      console.error("Error using Mermaid tool:", error);
    }
  } else {
    console.log("render_mermaid tool not available");
  }
  
  client.close();
}

main().catch(console.error); 