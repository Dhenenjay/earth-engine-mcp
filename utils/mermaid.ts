import axios from 'axios';

/**
 * Renders a Mermaid diagram code to SVG using mermaid.ink service
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The SVG data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  try {
    console.log('Rendering Mermaid diagram using mermaid.ink...');
    
    // Base64 encode the mermaid code
    const base64Diagram = Buffer.from(mermaidCode).toString('base64');
    
    // Create the URL for mermaid.ink - a public API for rendering mermaid diagrams
    const url = `https://mermaid.ink/svg/${base64Diagram}`;
    
    console.log(`Using mermaid.ink URL: ${url}`);
    
    // Fetch the SVG directly from the service
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch SVG: ${response.statusText}`);
    }
    
    // Convert the response to base64
    const base64Svg = Buffer.from(response.data).toString('base64');
    
    console.log('Successfully rendered Mermaid diagram');
    
    return base64Svg;
  } catch (error: unknown) {
    console.error('Error rendering Mermaid diagram:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to render Mermaid diagram: ${errorMessage}`);
  }
} 