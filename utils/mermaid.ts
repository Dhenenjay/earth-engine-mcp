import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { JSDOM } from 'jsdom';

const execPromise = util.promisify(exec);

/**
 * Renders a Mermaid diagram code to PNG using mermaid-cli or falls back to simpler methods
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG data as a base64 string
 */
export async function renderMermaidToPng(mermaidCode: string): Promise<string> {
  // First, try the mermaid-cli approach
  try {
    console.log('Attempting to render Mermaid diagram using mermaid-cli...');
    
    // Create temp directory for files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-'));
    
    // Save mermaid code to file
    const mermaidFile = path.join(tempDir, 'diagram.mmd');
    fs.writeFileSync(mermaidFile, mermaidCode);
    
    // Output PNG file path
    const outputFile = path.join(tempDir, 'diagram.png');
    
    // Path to mmdc binary in node_modules
    const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
    
    // Create puppeteer config (simplified for serverless)
    const puppeteerConfigPath = path.join(tempDir, 'puppeteer-config.json');
    
    // Create a simplified puppeteer config
    const puppeteerConfig = {
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: true
    };
    
    fs.writeFileSync(puppeteerConfigPath, JSON.stringify(puppeteerConfig, null, 2));
    
    // Execute the mermaid-cli command with puppeteer config
    const command = `"${mmdcPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent -p "${puppeteerConfigPath}"`;
    
    console.log(`Executing mermaid-cli command: ${command}`);
    
    // Set environment variables for serverless environment
    const customEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      PUPPETEER_CACHE_DIR: '/tmp',
    };
    
    try {
      // Execute command with specified environment
      await execPromise(command, { env: customEnv, timeout: 15000 });
      
      // Check if output file exists
      if (fs.existsSync(outputFile)) {
        // Read the generated PNG file
        const pngBuffer = fs.readFileSync(outputFile);
        
        // Clean up temporary files
        try {
          fs.unlinkSync(mermaidFile);
          fs.unlinkSync(outputFile);
          fs.unlinkSync(puppeteerConfigPath);
          fs.rmdirSync(tempDir);
        } catch (cleanupError) {
          console.warn('Warning: Failed to clean up temporary files:', cleanupError);
        }
        
        // Convert to base64
        const base64Png = pngBuffer.toString('base64');
        console.log('Successfully rendered Mermaid diagram to PNG using mermaid-cli');
        
        return base64Png;
      }
    } catch (execError) {
      console.error('mermaid-cli execution failed:', execError);
      // Don't throw here, let it fall through to the fallback method
    }
  } catch (error) {
    console.error('Error setting up mermaid-cli:', error);
    // Continue to fallback method
  }
  
  // Fallback to a simpler approach using mermaid's output directly
  try {
    console.log('Falling back to simple SVG rendering approach...');
    
    // Use mermaid directly (serverless safe method)
    const mermaidScript = `
      <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default'
        });
        
        window.renderMermaid = async function() {
          try {
            const { svg } = await mermaid.render('mermaid-diagram', \`${mermaidCode.replace(/`/g, '\\`')}\`);
            document.getElementById('result').textContent = svg;
          } catch (error) {
            document.getElementById('error').textContent = JSON.stringify(error);
          }
        };
      </script>
    `;
    
    // Create an HTML page with the mermaid code
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mermaid Rendering</title>
          ${mermaidScript}
        </head>
        <body>
          <div id="mermaid-container"></div>
          <pre id="result" style="display:none;"></pre>
          <pre id="error" style="display:none;"></pre>
          <script>
            window.renderMermaid();
          </script>
        </body>
      </html>
    `;
    
    // Use JSDOM to execute the script
    const dom = new JSDOM(html, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true
    });
    
    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract the SVG content
    const svgContent = dom.window.document.getElementById('result')?.textContent;
    
    if (!svgContent) {
      const error = dom.window.document.getElementById('error')?.textContent;
      throw new Error(`Mermaid rendering failed: ${error || 'Unknown error'}`);
    }
    
    // For simplicity, we'll return the SVG as base64 (client can handle it as an image)
    const svgBase64 = Buffer.from(svgContent).toString('base64');
    console.log('Successfully rendered Mermaid diagram to SVG');
    
    return svgBase64;
  } catch (fallbackError) {
    console.error('All rendering approaches failed:', fallbackError);
    throw new Error(`Failed to render Mermaid diagram: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
  }
} 