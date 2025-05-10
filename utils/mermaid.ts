import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { JSDOM } from 'jsdom';

const execPromise = util.promisify(exec);

/**
 * Simplified SVG template for server-side rendering
 * This approach doesn't rely on ES modules which can be problematic in JSDOM
 */
function generateSimpleSvgDiagram(mermaidCode: string): string {
  // Generate a simple SVG fallback with the code as text
  // This is better than nothing if all other rendering fails
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="#f8f9fa" />
    <style>
      text { font-family: monospace; font-size: 14px; fill: #333; }
    </style>
    <text x="20" y="30">Mermaid Diagram Code:</text>
    <text x="20" y="60">${mermaidCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').split('\n').map((line, i) => `<tspan x="20" dy="${i === 0 ? 0 : 20}">${line}</tspan>`).join('')}</text>
  </svg>
  `;
}

/**
 * Renders a Mermaid diagram code to PNG using mermaid-cli or falls back to simpler methods
 * @param mermaidCode The Mermaid diagram code to render
 * @returns The PNG or SVG data as a base64 string
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
    
    // Paths to try for mmdc binary
    const possibleMmdcPaths = [
      path.join(process.cwd(), 'node_modules', '.bin', 'mmdc'),
      path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli', 'index.js'),
      '/var/task/node_modules/.bin/mmdc',
      // Add more potential paths if needed
    ];
    
    // Find first existing mmdc path
    let mmdcPath = null;
    for (const potentialPath of possibleMmdcPaths) {
      if (fs.existsSync(potentialPath)) {
        mmdcPath = potentialPath;
        console.log(`Found mermaid-cli at: ${mmdcPath}`);
        break;
      }
    }
    
    if (!mmdcPath) {
      throw new Error('mermaid-cli binary not found in expected locations');
    }
    
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
    const command = `node "${mmdcPath}" -i "${mermaidFile}" -o "${outputFile}" -b transparent -p "${puppeteerConfigPath}"`;
    
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
  
  // Fallback to a very simple SVG renderer
  try {
    console.log('Falling back to static SVG fallback...');
    
    // Generate a simple SVG with the mermaid code
    const svgContent = generateSimpleSvgDiagram(mermaidCode);
    
    // Convert to base64
    const svgBase64 = Buffer.from(svgContent).toString('base64');
    console.log('Successfully created fallback SVG diagram');
    
    return svgBase64;
  } catch (fallbackError) {
    console.error('All rendering approaches failed:', fallbackError);
    throw new Error(`Failed to render Mermaid diagram: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
  }
} 