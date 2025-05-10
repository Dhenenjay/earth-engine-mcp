import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

/**
 * Renders a Mermaid diagram code to PNG using server-side Mermaid rendering
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  try {
    console.log('Rendering Mermaid diagram using server-side approach...');
    
    // Create virtual DOM environment
    const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="container"></div></body></html>`, {
      runScripts: "dangerously",
      resources: "usable",
      url: "https://localhost"
    });
    
    const window = dom.window;
    
    // Use a safer approach for navigator
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'node.js',
        language: 'en-US',
      },
      writable: true
    });
    
    // Create a new script element and load Mermaid
    const script = window.document.createElement('script');
    script.textContent = `
      window.mermaidConfig = {
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'default'
      };
    `;
    window.document.head.appendChild(script);
    
    // Load the mermaid library directly from CDN
    const mermaidScript = window.document.createElement('script');
    mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    window.document.head.appendChild(mermaidScript);
    
    // Wait for mermaid to load
    await new Promise(resolve => {
      mermaidScript.onload = resolve;
      // Fallback if onload doesn't fire
      setTimeout(resolve, 3000);
    });
    
    // Check if mermaid loaded
    if (!(window as any).mermaid) {
      throw new Error('Failed to load Mermaid library');
    }
    
    console.log('Mermaid loaded, rendering diagram...');
    
    // Render the diagram
    const container = window.document.getElementById('container');
    if (!container) {
      throw new Error('Container element not found');
    }
    container.innerHTML = `<pre class="mermaid">${mermaidCode}</pre>`;
    
    // Initialize and render
    await (window as any).mermaid.initialize((window as any).mermaidConfig);
    await (window as any).mermaid.run();
    
    // Get the SVG content
    const svgElement = window.document.querySelector('svg');
    if (!svgElement) {
      throw new Error('Failed to generate SVG from Mermaid diagram');
    }
    
    const svgContent = svgElement.outerHTML;
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Save SVG to file
    const svgPath = path.join(tempDir, 'temp-diagram.svg');
    fs.writeFileSync(svgPath, svgContent);
    
    // Convert SVG to PNG using Sharp
    const { default: sharp } = await import('sharp');
    
    console.log('Converting SVG to PNG...');
    const pngBuffer = await sharp(svgPath)
      .png()
      .toBuffer();
    
    // Clean up temporary file
    fs.unlinkSync(svgPath);
    
    // Convert to base64
    const base64Png = pngBuffer.toString('base64');
    
    console.log('Successfully rendered Mermaid diagram to PNG');
    
    // Clean up
    window.close();
    
    return base64Png;
  } catch (error: unknown) {
    console.error('Error rendering Mermaid diagram:', error);
    
    // Fallback to a different approach
    try {
      console.log('Falling back to alternative rendering approach...');
      return await renderWithMermaidCLI(mermaidCode);
    } catch (fallbackError) {
      console.error('Fallback rendering also failed:', fallbackError);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to render Mermaid diagram: ${errorMessage}`);
    }
  }
}

/**
 * Fallback renderer using the Mermaid CLI
 */
async function renderWithMermaidCLI(mermaidCode: string): Promise<string> {
  try {
    // Use the Puppeteer-based approach using mermaid-cli
    const { default: puppeteer } = await import('puppeteer');
    
    // Launch headless browser
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Load Mermaid from CDN
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <script>
          mermaid.initialize({ startOnLoad: true });
        </script>
      </head>
      <body>
        <div class="mermaid">
          ${mermaidCode}
        </div>
      </body>
      </html>
    `);
    
    // Wait for Mermaid to initialize and render
    await page.waitForSelector('svg');
    
    // Get the rendered SVG
    const svgHandle = await page.$('svg');
    if (!svgHandle) {
      throw new Error('SVG not found');
    }
    
    // Take a screenshot of just the SVG
    const pngBuffer = await svgHandle.screenshot();
    
    // Close the browser
    await browser.close();
    // Convert to base64
    return Buffer.from(pngBuffer).toString('base64');
  } catch (error) {
    console.error('Puppeteer rendering failed:', error);
    throw error;
  }
} 