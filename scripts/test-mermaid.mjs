import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import fs from 'fs';

const baseUrl = process.argv[2] || "http://localhost:3005";

// Example Mermaid diagram code
const sampleMermaidCode = `
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
`;

async function main() {
  // Using the 'sse' transport parameter for the dynamic [transport] route
  const transportUrl = new URL(`${baseUrl}/sse`);
  console.log("Connecting to", transportUrl.toString());
  
  const transport = new SSEClientTransport(transportUrl);

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

  try {
    console.log("Connecting to", transportUrl.toString());
    await client.connect(transport);

    console.log("Connected", client.getServerCapabilities());

    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);
    
    if (tools.includes("render_mermaid")) {
      console.log("\nTesting Mermaid rendering tool...");
      console.log("Sample Mermaid code:", sampleMermaidCode);
      
      try {
        const result = await client.useTool("render_mermaid", {
          mermaidCode: sampleMermaidCode
        });
        
        console.log("Tool response:", result);
        
        // If we got an image back, save it to a file
        if (result.content && result.content[0] && result.content[0].type === 'image') {
          const imageData = result.content[0].data;
          fs.writeFileSync('mermaid-output.png', Buffer.from(imageData, 'base64'));
          console.log("Image saved to mermaid-output.png");
        }
      } catch (error) {
        console.error("Error using Mermaid tool:", error);
      }
    } else {
      console.log("render_mermaid tool not available");
    }
  } catch (error) {
    console.error("Connection error:", error.message || error);
  } finally {
    client.close();
  }
}

main().catch(console.error); 